/* ================ [ IMPORTS ] ================ */

// React components
import { useState } from "react";

// UI components
import { Button } from "./ui/Button";
import { Input } from "./ui/Input";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/Accordion";

/* ================ [ COMPONENT ] ================ */

// FAQ data
const faqs = [
  {
    question: "Why Discord?",
    answer:
      "Discord is where influencers naturally hang out, especially in gaming & tech niches. Emails get buried, go to spam, or never get opened. With Discord, messages are instant, notifications always go through, and influencers can apply to sponsorships with one reaction. No waiting. No chasing people down.",
  },
  {
    question: "How much does WARM cost?",
    answer:
      "Right now, WARM is in open beta and completely free. Eventually, we'll take a small fee from influencers instead of charging brands a monthly rate. This keeps it accessible for brands without forcing them into subscriptions.",
  },
  {
    question: "How do I know the influencers are legit?",
    answer:
      "WARM's Discord community is invite-only. We don't let just anyone in. Influencers have to meet certain quality standards based on audience size, engagement, and past brand deals. Since the network is private, you're only getting creators who are serious about sponsorships.",
  },
  {
    question: "What if influencers don't respond?",
    answer:
      "That's the problem with email, not WARM. Influencers check Discord multiple times a day, and since we send casting calls directly through a server they've joined, responses come in fast. No more waiting around for replies that never come.",
  },
  {
    question: "Is this just another influencer database?",
    answer:
      "No. Databases just sit there. WARM actively brings influencers to you. Instead of spending hours searching for creators, blasting out cold emails, and hoping someone responds, WARM puts your campaign in front of the right influencers automatically.",
  },
  {
    question: "Can I negotiate influencer rates?",
    answer:
      "Yes. When influencers apply, you'll see their rates up front. If a price is too high, you can send a counteroffer with one click. No back-and-forth email threads, just quick and easy rate adjustments.",
  },
  {
    question: "Do influencers see other applicants?",
    answer:
      "No. Every influencer only sees the casting call and their private chat with the brand. Nobody knows who else applied, so creators don't feel pressured to undercut their rates or change their approach based on competition.",
  },
  {
    question: "What if I need help managing the campaign?",
    answer:
      "We offer a fully managed option where we handle everything for you—finding influencers, negotiating rates, approving content, and making sure everything gets posted. If you want to manage it yourself but need backup, we also provide 24/7 campaign support in case something goes wrong.",
  },
  {
    question: "What happens after influencers commit?",
    answer:
      "Once an influencer applies, you'll get a list with their stats, pricing, and availability in 24 hours or less. You can approve creators, negotiate rates, and chat with them directly inside WARM. No waiting weeks to build a list.",
  },
  {
    question: "How is WARM different from cold email outreach?",
    answer:
      "Cold emails get ignored. WARM sends casting calls directly to influencers where they actually spend time. No spam folders, no emails sitting unread, no endless follow-ups. Just instant replies from creators ready to work with your brand.",
  },
];

// FAQ component
function FAQ() {
  const [email, setEmail] = useState("");

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-5xl">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-8 font-montserrat inline-block whitespace-nowrap">
            Ditch <span className="text-blue-400">COLD</span> Influencer
            Outreach With <span className="text-[#FF6100]">WARM</span>
          </h2>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto mb-24">
          <Input
            placeholder="Enter your email..."
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-12 font-montserrat"
          />
          <Button className="bg-[#FF6100] hover:bg-[#FF6100]/90 h-12 px-8 font-montserrat font-bold">
            Join Waitlist
          </Button>
        </div>

        <h3 className="text-2xl font-bold text-center text-gray-600 mb-8 font-montserrat">
          Frequently asked questions
        </h3>

        <div className="mt-12">
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="font-bold font-montserrat">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="font-medium font-montserrat">
                  <div className="animate-fadeIn">{faq.answer}</div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

/* ================ [ EXPORTS ] ================ */

export { FAQ };
