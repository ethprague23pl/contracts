// request
export class CreateAccountRequest {
    owner: string;
}

export class CreateEventRequest {
    owner: string;
}

export class BuyTicketRequest {
    owner: string;
}

// response
export class CreateAccountReesponse {
    success: boolean;
}

export class CreateEventResponse {
    success: boolean;
}

export class BuyTicketResponse {
    success: boolean;
}