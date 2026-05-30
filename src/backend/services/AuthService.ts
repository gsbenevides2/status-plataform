import crypto from "node:crypto";
import * as jose from "jose";

export class InvalidCredentialsError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "InvalidCredentialsError";
	}
}

function isNonEmptyString(v: unknown): v is string {
	return typeof v === "string" && v.trim().length > 0;
}

export class AuthService {
	token: string | null = null;
	// Variáveis de login: se qualquer uma delas não estiver definida,
	// o app deve ficar em modo "acesso livre".
	static username = Bun.env.AUTH_USERNAME;
	static password = Bun.env.AUTH_PASSWORD;
	static secret = Bun.env.AUTH_SECRET;
	static sessionId: string | null = null;

	static isAuthEnabled(): boolean {
		return (
			isNonEmptyString(AuthService.username) &&
			isNonEmptyString(AuthService.password) &&
			isNonEmptyString(AuthService.secret)
		);
	}

	static generateUniqueSessionId() {
		AuthService.sessionId = crypto.randomBytes(32).toString("hex");
	}

	static async authenticate(username: string, password: string) {
		if (username !== AuthService.username) {
			return new InvalidCredentialsError("Invalid email");
		}

		if (password !== AuthService.password) {
			return new InvalidCredentialsError("Invalid password");
		}

		AuthService.generateUniqueSessionId();

		const privateKey = new TextEncoder().encode(
			`${AuthService.secret}:${AuthService.sessionId}`,
		);
		const token = await new jose.SignJWT({ username })
			.setProtectedHeader({ alg: "HS256" })
			.setExpirationTime("1h")
			.sign(privateKey);

		return token;
	}

	static async verify(token: string) {
		if (!AuthService.sessionId) {
			return new InvalidCredentialsError("No session id found");
		}
		try {
			const privateKey = new TextEncoder().encode(
				`${AuthService.secret}:${AuthService.sessionId}`,
			);
			const { payload } = await jose.jwtVerify(token, privateKey);
			return payload;
		} catch (_) {
			return new InvalidCredentialsError("Invalid token");
		}
	}

	static async verifyFromHeader(headerValue: string) {
		if (AuthService.secret !== headerValue) {
			return false;
		}
		return true;
	}

	static async logout() {
		AuthService.sessionId = null;
	}
}
