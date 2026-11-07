import { HttpResponse } from 'msw'

// An error response shaped like the backend's: a ProblemDetail (RFC 9457) with the message in 'detail'
export const problemDetailResponse = (status: number, detail: string) =>
    HttpResponse.json(
        { type: 'about:blank', status, detail },
        { status, headers: { 'Content-Type': 'application/problem+json' } }
    )
