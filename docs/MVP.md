# MVP v0

## Demo objective
A business owner can create an organization, add business knowledge and policies, receive a simulated lead, let an AI operator handle the case, approve a sensitive action, and see the resulting commercial outcome in an Action Ledger.

## Golden-path scenario
1. New lead asks about a service.
2. Operator retrieves approved company knowledge.
3. Operator asks only necessary qualification questions.
4. Operator identifies an opportunity and creates a goal/task.
5. Low-risk communication can be proposed or executed according to autonomy.
6. A discount or exceptional commitment triggers approval.
7. Customer accepts and a simulated booking/sale is recorded.
8. Dashboard shows action history, AI cost, assisted revenue and attribution basis.

## Not in v0
- Paid WhatsApp integration
- Phone/voice agent
- Autonomous payments
- Bulk cold outreach
- Complex CRM replacement
- Custom model training
- Native mobile apps

## Success criteria
- Complete demo can be understood in under 3 minutes.
- Every AI action is explainable through source context, policy and ledger.
- Tenant isolation tests pass.
- No paid external channel is required.
- AI/provider can be replaced without changing the domain model.


## Ask Your Business

The owner can ask plain-language questions about the business, such as:
- What do I have to do today?
- Which customers are waiting for a reply?
- Which opportunities are still pending?
- What happened with a specific customer?
- What assisted revenue was recorded this week?

Answers must be grounded only in tenant-scoped data the signed-in user is allowed to access. If the data is missing or ambiguous, the Operator must say so rather than invent an answer.

The assistant may also propose a next action from the answer (for example, preparing follow-up for stale opportunities), but execution remains subject to the same autonomy and approval policy as every other Operator action.


## Two question surfaces

### Customer-facing questions
The Operator may answer customer questions only from approved customer-safe knowledge and customer-scoped records. Internal notes, business metrics, other customers, private policies and operational data must never be exposed.

### Business-facing questions
Authenticated organization members may ask questions over tenant-scoped operational data according to their role, including pending work, conversations, opportunities, outcomes and assisted revenue.

### Boundary
Customer-facing and business-facing retrieval are separate permission contexts. Sharing the same Operator engine must never imply sharing the same data access. Every answer must be grounded in the caller's permitted context; missing evidence produces an explicit uncertainty or escalation, not fabrication.
