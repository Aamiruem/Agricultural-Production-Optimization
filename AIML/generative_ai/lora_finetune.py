"""Parameter-efficient fine-tuning (LoRA / QLoRA) of an open-source LLM on
agronomy instructions with Hugging Face Transformers + PEFT + TRL.

* LoRA   — freeze the base model, train small low-rank adapters (A·B) in the
           attention projections: ~0.1-1% of the parameters.
* QLoRA  — the same, on a 4-bit quantised base model (bitsandbytes NF4), so a
           1-3B model fits on one consumer GPU.

Training data is built from the project's knowledge base (one instruction per
section). Needs a CUDA GPU for QLoRA; `--no-4bit` runs plain LoRA anywhere.

    pip install -r AIML/requirements-dl.txt
    python -m AIML.generative_ai.lora_finetune --model Qwen/Qwen2.5-0.5B-Instruct --epochs 3
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from AIML.config import KNOWLEDGE_DIR, MODELS_DIR


def build_instructions(knowledge_dir: Path = KNOWLEDGE_DIR) -> list[dict]:
    """Turn '## Section' blocks into {instruction, response} pairs."""
    rows = []
    for path in sorted(knowledge_dir.glob("*.md")):
        title, section, lines = path.stem, None, []
        for line in path.read_text(encoding="utf-8").splitlines() + ["## END"]:
            if line.startswith("# "):
                title = line[2:].strip()
            elif line.startswith("## "):
                if section and lines:
                    rows.append(
                        {
                            "instruction": f"{title}: explain '{section}' for an Indian farmer.",
                            "response": " ".join(l.strip() for l in lines if l.strip()),
                        }
                    )
                section, lines = line[3:].strip(), []
            else:
                lines.append(line)
    return rows


def run(model_name: str, epochs: int, use_4bit: bool) -> str:
    import torch
    from datasets import Dataset
    from peft import LoraConfig, prepare_model_for_kbit_training
    from transformers import AutoModelForCausalLM, AutoTokenizer, BitsAndBytesConfig
    from trl import SFTConfig, SFTTrainer

    tok = AutoTokenizer.from_pretrained(model_name)
    quant = (
        BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_quant_type="nf4",
            bnb_4bit_use_double_quant=True,
            bnb_4bit_compute_dtype=torch.bfloat16,
        )
        if use_4bit
        else None
    )
    model = AutoModelForCausalLM.from_pretrained(model_name, quantization_config=quant, device_map="auto")
    if use_4bit:
        model = prepare_model_for_kbit_training(model)

    def to_chat(row):
        msgs = [{"role": "user", "content": row["instruction"]}, {"role": "assistant", "content": row["response"]}]
        return {"text": tok.apply_chat_template(msgs, tokenize=False)}

    data = Dataset.from_list(build_instructions()).map(to_chat)
    lora = LoraConfig(
        r=16,
        lora_alpha=32,
        lora_dropout=0.05,
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    out = MODELS_DIR / "agri-lora"
    trainer = SFTTrainer(
        model=model,
        train_dataset=data,
        peft_config=lora,
        processing_class=tok,
        args=SFTConfig(
            output_dir=str(out),
            num_train_epochs=epochs,
            per_device_train_batch_size=2,
            gradient_accumulation_steps=4,
            learning_rate=2e-4,
            logging_steps=5,
            dataset_text_field="text",
            report_to=[],
        ),
    )
    trainer.model.print_trainable_parameters()
    trainer.train()
    trainer.save_model(str(out))  # saves only the adapter weights (a few MB)
    return str(out)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct")
    ap.add_argument("--epochs", type=int, default=3)
    ap.add_argument("--no-4bit", action="store_true")
    ap.add_argument("--dry-run", action="store_true", help="only print the training data")
    a = ap.parse_args()
    if a.dry_run:
        print(json.dumps(build_instructions()[:3], indent=2))
    else:
        print("adapter saved to", run(a.model, a.epochs, not a.no_4bit))
