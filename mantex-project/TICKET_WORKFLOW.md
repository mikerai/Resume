# Mantex Ticket Workflow

## States
The system supports the following ticket states:
- `pending`: Initial state. Waiting for supplier assignment or acceptance.
- `opened`: Supplier accepted the ticket. Scheduled.
- `rejected`: Supplier rejected the assignment OR Client rejected the work.
- `in_progress`: Work has started.
- `completed`: Work finished by supplier. Evidence uploaded.
- `under_review`: Supplier submitted changes after a revision request.
- `revision_requested`: Admin/Client requested changes to the work.
- `approved`: Work approved by Admin/Reviewer. Sent to Client for final acceptance.
- `ready_for_payment`: Client accepted the work. Waiting for payment.
- `paid`: Payment completed.
- `closed`: Ticket closed by Client/Admin.
- `cancelled`: Ticket cancelled before completion.

## Workflow Transitions

### 1. Creation
- **Client** creates ticket.
- Selects **Type**: `preventive` or `corrective`.
- **Status**: `pending`.
- If `preventive`: Auto-assign to Supplier (if logic exists).
- If `corrective`: Waiting for Supplier assignment/acceptance.

### 2. Assignment & Acceptance (Supplier)
- **Current State**: `pending`
- **Action**: Supplier views ticket.
- **Transition**:
    - **Accept** -> `opened` (Notify Client)
    - **Reject** -> `rejected` (Notify Client)

### 3. Execution (Supplier)
- **Current State**: `opened`
- **Action**: Supplier starts work.
- **Transition**: **Start** -> `in_progress` (Notify Client)

- **Current State**: `in_progress`
- **Action**: Supplier finishes work, uploads evidence.
- **Transition**: **Complete** -> `completed` (Notify Admin/Client for review)

### 4. Review (Admin/Client)
- **Current State**: `completed` or `under_review`
- **Action**: Review evidence.
- **Transition**:
    - **Approve** -> `approved` (Notify Client)
    - **Request Changes** -> `revision_requested` (Notify Supplier)
    - **Reject** -> `rejected` (Notify Client/Supplier)

### 5. Revision (Supplier)
- **Current State**: `revision_requested`
- **Action**: Supplier performs fixes.
- **Transition**: **Submit Fix** -> `under_review` (Notify Reviewer)

### 6. Client Acceptance
- **Current State**: `approved`
- **Action**: Client reviews final work.
- **Transition**:
    - **Accept** -> `ready_for_payment` (Notify Supplier)
    - **Reject** -> `rejected` (Notify Supplier)

### 7. Payment
- **Current State**: `ready_for_payment`
- **Action**: Payment processing.
- **Transition**: **Pay** -> `paid` (Notify Client)

### 8. Closure
- **Current State**: `paid`
- **Action**: Final closure.
- **Transition**: **Close** -> `closed` (Notify Supplier)
