"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";

export default function FAQClientPage() {
  return (
    <div className="max-w-5xl mx-auto">
      <h1 className="text-2xl font-semibold mb-2">Frequently Asked Questions</h1>
      <p className="text-sm text-muted-foreground mb-4">For those of you who don't read the pins</p>
      <Accordion type="single" collapsible>
        <AccordionItem value="1">
          <AccordionTrigger>What is Print Legion?</AccordionTrigger>
          <AccordionContent>
            Print Legion is a platform that connects Hack Clubbers with 3D printers with those who don't
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="2">
            <AccordionTrigger>
                What's in it for the printer?
            </AccordionTrigger>
            <AccordionContent>
                You get to help out the community! Any filament used will be reimbursed by Hack Club (rates: coming soon™️)
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="3">
            <AccordionTrigger>
                What can I print?
            </AccordionTrigger>
            <AccordionContent>
                You can print parts for anything as long as it's from a YSWS!
            </AccordionContent>
        </AccordionItem>
        <AccordionItem value="4">
        <AccordionTrigger>
            How do I submit a print?
          </AccordionTrigger>
          <AccordionContent>
            You can submit a print by going to the <Link href="/dashboard/jobs/create">Submit Job</Link> page.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}