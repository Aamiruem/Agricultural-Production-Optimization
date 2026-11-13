"""Fine-tune a BERT-family model for farmer-query intent classification
(Hugging Face Transformers). Multilingual DistilBERT handles English and
romanised Hindi.

    pip install -r AIML/requirements-dl.txt
    python -m AIML.nlp.bert_finetune --epochs 8
"""
from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
import pandas as pd

from AIML.config import MODELS_DIR, RANDOM_STATE

DATA = Path(__file__).parent / "data" / "farmer_queries.csv"
MODEL_NAME = "distilbert-base-multilingual-cased"


def run(epochs: int = 8, model_name: str = MODEL_NAME) -> dict:
    from datasets import Dataset
    from sklearn.model_selection import train_test_split
    from transformers import (AutoModelForSequenceClassification, AutoTokenizer, DataCollatorWithPadding, Trainer,
                              TrainingArguments)

    df = pd.read_csv(DATA)
    labels = sorted(df["intent"].unique())
    label2id = {l: i for i, l in enumerate(labels)}
    df["label"] = df["intent"].map(label2id)
    train_df, test_df = train_test_split(df, test_size=0.25, stratify=df["label"], random_state=RANDOM_STATE)

    tok = AutoTokenizer.from_pretrained(model_name)
    enc = lambda b: tok(b["text"], truncation=True, max_length=64)  # noqa: E731 - tokenisation (WordPiece)
    train_ds = Dataset.from_pandas(train_df[["text", "label"]]).map(enc, batched=True)
    test_ds = Dataset.from_pandas(test_df[["text", "label"]]).map(enc, batched=True)

    model = AutoModelForSequenceClassification.from_pretrained(
        model_name, num_labels=len(labels), id2label=dict(enumerate(labels)), label2id=label2id)

    def metrics(pred):
        acc = float((np.argmax(pred.predictions, -1) == pred.label_ids).mean())
        return {"accuracy": acc}

    out_dir = MODELS_DIR / "bert-intent"
    trainer = Trainer(
        model=model,
        args=TrainingArguments(out_dir, num_train_epochs=epochs, learning_rate=5e-5, per_device_train_batch_size=16,
                               eval_strategy="epoch", save_strategy="no", seed=RANDOM_STATE, report_to=[]),
        train_dataset=train_ds, eval_dataset=test_ds, data_collator=DataCollatorWithPadding(tok),
        compute_metrics=metrics,
    )
    trainer.train()
    trainer.save_model(out_dir)
    tok.save_pretrained(out_dir)
    return trainer.evaluate()


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--epochs", type=int, default=8)
    print(run(ap.parse_args().epochs))
