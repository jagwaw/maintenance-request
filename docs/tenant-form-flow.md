# Tenant form — how it works

Pages: `/` (landing), `/request` (form), `/request/submitted/[ref]` (success) · Component: `components/RequestForm.vue` · API: `POST /api/requests`

## What the tenant sees

```mermaid
flowchart TD
    START([Tenant opens /]) --> LAND[Landing page<br/>emergency notice + 'Submit a maintenance request']
    LAND --> A([Form at /request])
    A --> B[Emergency notice<br/>always at the top]
    B --> C[Pick property → unit]
    C --> D[Name + email and/or phone]
    D --> E[Pick category]
    E --> F[Answer follow-up questions<br/>from config/maintenance.ts]
    F --> G{Answer is an emergency?<br/>e.g. 'water leaking now'}
    G -- yes --> H[Show emergency notice again]
    G -- no --> I
    H --> I{Category has a self-check?<br/>AC, electrical}
    I -- yes --> J[Show safe things to try]
    J --> K[“Still not fixed — continue”]
    K --> L
    I -- no --> L[Description]
    L --> M[Photos, up to 3<br/>resized to 1600px JPEG in the browser]
    M --> N[Permission to enter<br/>+ optional pets, best times]
    N --> O[Submit]
    O --> P([Success page /request/submitted/MR-7KQ2X9<br/>shows the reference code])
    P -- Submit another request --> A
```

## What happens on submit (server)

```mermaid
flowchart TD
    S([POST /api/requests]) --> H{Hidden honeypot<br/>field filled?}
    H -- yes, it's a bot --> FAKE([Return a fake code<br/>nothing saved])
    H -- no --> P{Photos OK?<br/>≤ 3, image MIME +<br/>magic bytes match, ≤ 2 MB}
    P -- no --> E400([400 error])
    P -- yes --> Z{Zod validation<br/>category, answers, contact}
    Z -- no --> E400
    Z -- yes --> M{Email or phone matches<br/>a tenant on that unit?}
    M -- yes --> V[contact_verified = true<br/>link tenant_id]
    M -- no --> U[contact_verified = false<br/>staff see 'Unverified contact']
    V --> UP
    U --> UP[Upload photos to private<br/>bucket request-photos]
    UP --> R[Insert request<br/>random ref code, status New]
    R --> L[logEvent: created by 'tenant']
    L --> OK([Return only the reference code])
```

The response is the same whether or not the contact matched, so the form never
reveals who lives in a unit.
