import { useState } from "react";
import { Mail, MessageSquareText } from "lucide-react";
import { PageHeader } from "@/components/common/PageHeader";

export default function ContactPage() {
 const [sent,setSent]=useState(false);
 return <><PageHeader title="Contact & feedback" description="Tell us what would make AgriSmart more useful for your farm or agriculture team."/><div className="tool-columns"><form className="tool-card" onSubmit={e=>{e.preventDefault();setSent(true)}}><h2>Send a note</h2><label className="field-label">Your name<input required placeholder="Name"/></label><label className="field-label">Email address<input type="email" required placeholder="you@example.com"/></label><label className="field-label">Topic<select><option>Product feedback</option><option>Technical support</option><option>Data correction</option><option>Partnership</option></select></label><label className="field-label">Message<textarea required rows="5" placeholder="How can we help?"/></label><button className="btn btn-success" type="submit"><MessageSquareText size={16}/> Send feedback</button>{sent&&<p className="text-success mt-3 mb-0" role="status">Thanks — your message has been prepared. Connect a support service to deliver submissions.</p>}</form><aside className="tool-card contact-aside"><Mail size={30}/><h2>Farmer support</h2><p>For urgent crop, pest or soil decisions, contact your local agriculture officer or Krishi Vigyan Kendra. This demo does not yet deliver contact form submissions to a support inbox.</p></aside></div></>;
}
