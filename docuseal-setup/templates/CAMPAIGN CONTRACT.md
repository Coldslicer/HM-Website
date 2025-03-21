# **MASTER CLIENT AGREEMENT**

This Master Client Agreement (the “Agreement”) is entered into by and between **Hotslicer Media LLC, doing business as Warm** (hereinafter “Warm”), a Wyoming limited liability company, and \_\_\_\_\_\_\_\_\_\_\_\_\_\_ (hereinafter “Client”). This Agreement is effective as of the last signature date indicated below (the “Effective Date”). Warm and the Client are collectively referred to as the “Parties” and individually as a “Party.”

---

## **1\. Purpose and Scope**

1.1 **Platform Description**  
 Warm operates a proprietary influencer marketing platform (“Platform”) that facilitates introductions, negotiations, and communications between brands and advertisers (“Client”) and independent content creators (“Influencers”). This Agreement defines each Party’s rights and obligations in connection with the use of the Platform and any resulting campaign(s).

1.2 **Nature of Relationship**  
 Warm is not an employer of, or agent for, any Influencer, nor does it guarantee that an Influencer will deliver specific results, adhere to any timeline without fault, or meet certain performance metrics. By entering into this Agreement, the Client acknowledges that Warm’s role is limited to providing and maintaining a system through which the Client and Influencers can communicate, negotiate rates, finalize deliverables, and manage campaigns.

1.3 **Binding Effect**  
 By executing this Agreement, Client affirms that it has read, understands, and agrees to be bound by all the terms set forth herein. This Agreement, together with any attached or subsequently executed Cover Sheets, Work Orders, or Insertion Orders referencing it, shall govern all influencer collaborations conducted via Warm.

---

## **2\. Campaign Terms & Work Order Table**

All specific campaign details, including Influencer names, channel URLs, deliverables, and rates, will be set forth in a table (an “Agency Work Order,” “Cover Sheet,” or “Insertion Order”), which is incorporated into this Agreement by reference. Each such table will include, but is not limited to, the following:

| CAMPAIGN TERMS |  |
| ----- | :---- |
| **Effective Date**       | <%= campaign.date %>   |
| **Campaign Term**        | <%= campaign.term %>   |
| **Campaign**             | <%= campaign.name %>   |
| **Brand**                | <%= campaign.company_name %> |
| **Campaign Brief URL**   | [<%= campaign.brief_url %>](<%= campaign.brief_url %>) |

| INFLUENCERS IN CAMPAIGN |  |  |  |
| ----- | ----- | ----- | ----- |
| **Influencer Name** | **Channel URL** | **Deliverables** | **Rate** |
<% creators.forEach(function(creator) { %>
| **<%= creator.name %>**   | [<%= creator.channel_url %>](<%= creator.channel_url %>) | <%= creator.deliverables %> | <%= creator.rate %> |
<% }); %>

**2.1 Brand’s Responsibility for the Campaign Brief** The Client’s specific instructions, creative requirements, and deliverables for Influencers are detailed within the Campaign Brief (linked above). The Client is solely responsible for ensuring that the Campaign Brief is clear, complete, and provided in a timely manner. Warm shall not be held liable for any delays, suboptimal content, or misunderstandings arising from an unclear or incomplete Campaign Brief.

**2.2 Fully Managed Campaign Selection** (Check one):

* \[ \] Client **has opted** for Fully Managed Campaign services. Client acknowledges an additional 15% fee applies to each Influencer’s rate, as reflected in the table or invoice.  
* \[ \] Client **has not opted** for Fully Managed Campaign services and agrees to manage all Influencer communications and logistics.

Each table, upon signature or digital acceptance, becomes part of this Agreement.

---

## **3\. Services Provided**

3.1 **Self-Serve Campaign**  
 For a standard (“Self-Serve”) campaign, Warm will provide the Client with access to the Platform, enabling the Client to:

* Review Influencer profiles, rates, and availability.  
* Send campaign briefs and instructions via Warm’s web interface.  
* Communicate directly with Influencers (via Warm’s Discord-based chat proxy) to discuss deliverables, revisions, and other campaign details.

**Client Responsibility**: The Client is solely responsible for ensuring the adequacy of its campaign objectives, briefs, and instructions provided to Influencers. Warm assumes no liability for final campaign outcomes, including but not limited to Influencer engagement, content quality, or adherence to deadlines. Any failure on the Client’s part to provide timely feedback, approvals, or modifications shall not be deemed a breach by Warm.

3.2 **Fully Managed Campaign (Additional 15% Fee)**  
 If the Client opts for the “Fully Managed Campaign” by checking the box in the table above, Warm will:

* Take on the role of representing the Client in day-to-day Influencer communications.  
* Coordinate logistics, scheduling, and content deadlines on behalf of the Client.  
* Process and communicate any requested changes or revisions from the Client to the Influencers.  
* Use best efforts to ensure Influencers publish deliverables on time.

**Client Obligations Under Fully Managed:**

* The Client must still approve draft content, including scripts or videos, and provide clear revision requests or changes within any specified time frames. If the Client fails to provide timely feedback, Warm is not liable for any delay or the final quality of the deliverables.  
* The Client must also approve the final content and is responsible for promptly paying all associated invoices.

**No Guarantee of Results:** Even under a Fully Managed Campaign, Warm does not guarantee any specific outcome, view count, audience engagement, or revenue.

---

## **4\. Payment & Compensation**

4.1 **Client Pays Warm**  
 All Influencer fees, platform fees, and any applicable Fully Managed Campaign fees are payable directly to Warm. Warm will then disburse the agreed-upon rates to the Influencers on the Client’s behalf.

4.2 **Invoice and Payment Terms**  
 Upon selection and confirmation of Influencers (and, if applicable, the Fully Managed Campaign), Warm will issue an invoice that outlines:

* Influencer Rates, including any 15% management fee if selected.  
* Warm’s fees, if separately stated.  
* Payment due dates (e.g., Net 7, Net 15), and instructions for Wire or ACH transfer.

The Client must remit full payment by the stated due date. Warm reserves the right to suspend or terminate any campaign or account for non-payment and may pursue legal remedies if necessary.

4.3 **No Refunds**  
 Once an Influencer is confirmed or a contract is executed with said Influencer, all payments are final and non-refundable. The Client’s contract reflects the final rates payable; separate agreements govern Influencer payouts.

---

## **5\. Campaign Execution & Liability**

5.1 **Influencer Independence**  
 Influencers are independent third parties. Warm shall not be liable for any failure, delay, or shortfall in performance by Influencers. Should an Influencer deviate from the agreed scope, drop out, or cause delays, Warm will use reasonable efforts to assist, but assumes no responsibility for losses or damages arising therefrom.

5.2 **No Guaranteed Results**  
 The Client understands influencer marketing outcomes are inherently uncertain. Warm makes no warranties of success, ROI, or audience engagement. Any estimates or projections are for informational purposes only.

5.3 **Client’s Responsibility**  
 Regardless of whether the campaign is Self-Serve or Fully Managed, the Client remains responsible for:

* Providing timely and detailed feedback on draft content.  
* Approving or rejecting deliverables within the specified timeline.  
* Paying the invoice once the content is approved, or upon completion of deliverables.

If the Client’s failure to respond or provide feedback causes delays or leads to suboptimal content, Warm shall bear no liability for the resulting outcome.

---

## **6\. Communication via Warm’s Discord Chat Proxy**

6.1 **Message Flow Explanation**

* The Client composes a message within Warm’s web interface, which is then forwarded by Warm’s software to a Discord bot.  
* The Discord bot repeats the message in a specific channel accessible only to the designated Influencer(s) and Warm.  
* When the Influencer responds in Discord, the bot captures that response and displays it back to the Client through Warm’s interface.

6.2 **Legal Equivalence of Messages**  
 All messages exchanged in this manner shall be deemed legally binding communications. The fact that a message is relayed by a bot does not negate the authenticity or intent of the Party sending it.

6.3 **Data Retention**  
 Warm may store these message transcripts for compliance, dispute resolution, and record-keeping.

---

## **7\. Indemnification & Liability Limits**

7.1 **Indemnification by Client**  
 The Client agrees to indemnify, defend, and hold harmless Warm, its employees, and agents from any claims, damages, or expenses (including reasonable attorney’s fees) arising from:

* The Client’s instructions, brand guidelines, or creative briefs that violate third-party rights.  
* Any negligence, misconduct, or breach of this Agreement by the Client.  
* Any claim by an Influencer or third party resulting from the Client’s actions or omissions.

7.2 **Limitation of Liability**  
 **IN NO EVENT** shall Warm’s total liability under this Agreement exceed the fees actually paid by the Client for the specific campaign giving rise to the claim. Warm shall not be liable for indirect, consequential, special, incidental, or punitive damages, including lost profits or reputational harm.

7.3 **Force Majeure**  
 Neither Party shall be liable for delays or non-performance caused by events beyond its reasonable control, such as acts of nature, internet failures, strikes, or governmental actions.

---

## **8\. Non-Circumvention**

For a period of 60 days following the completion of the campaign or termination of this Agreement, the Client shall not circumvent Warm by directly engaging any Influencer introduced through Warm for the same or similar services. If the Client breaches this clause, Warm may recover liquidated damages in an amount equal to the Influencer’s original rate.

---

## **9\. Term & Termination**

9.1 **Term**  
 This Agreement commences on the Effective Date and remains in effect until terminated as provided herein. Each Work Order, Insertion Order, or Cover Sheet shall have its own term.

9.2 **Termination for Breach**  
 Either Party may terminate this Agreement if the other Party commits a material breach and fails to cure within seven (7) days of receiving written notice.

9.3 **Effect of Termination**  
 Termination does not negate any accrued payment obligations. Clauses relating to confidentiality, liability limitations, indemnification, and non-circumvention survive termination.

---

## **10\. Governing Law & Dispute Resolution**

10.1 **Choice of Law**  
 This Agreement shall be governed by the laws of the State of Wyoming, without regard to conflict of law principles.

10.2 **Arbitration**  
 Any dispute arising from or related to this Agreement shall be settled through binding arbitration in Wyoming. The Parties waive any right to a jury trial or class action.

---

## **11\. Miscellaneous**

11.1 **Entire Agreement**  
 This Agreement, together with any referenced Work Orders, constitutes the entire understanding between the Parties, superseding all prior discussions or proposals.

11.2 **Severability**  
 If any provision is deemed invalid, the remaining provisions remain effective.

11.3 **No Waiver**  
 A Party’s failure to enforce a provision does not waive the right to enforce it later.

11.4 **Electronic Signatures**  
 Execution by electronic or digital means is valid and enforceable.

11.5 **Notices**  
 Notices under this Agreement shall be in writing and deemed effective upon sending via email or other agreed method, provided no delivery error is reported.

---

## **12\. Signatures**

IN WITNESS WHEREOF, the Parties have caused this Agreement to be executed by their duly authorized representatives:

| Hotslicer Media LLC, d/b/a Warm Signature (Legal Name): \_\_\_\_\_\_\_\_\_\_ Signee Name: Shreyan Phadke Title: Founder & CEO Date: \_\_\_\_\_\_\_\_\_\_\_\_ | \_\_\_\_\_\_\_\_\_\_\_\_ (“Client”) Signature (Legal Name): \_\_\_\_\_\_\_\_\_\_ Signee Name: \_\_\_\_\_\_\_\_\_\_\_ Title: \_\_\_\_\_\_\_\_\_\_\_\_ Date: \_\_\_\_\_\_\_\_\_\_\_\_ |
| :---- | :---- |

By signing above, the Client explicitly acknowledges and agrees to the roles, responsibilities, and limitations described herein, including the selected Self-Serve or Fully Managed Campaign option, Warm’s limited liability, and non-circumvention obligations.

