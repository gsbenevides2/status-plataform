import axios from "axios";
import type { StatusReturn } from "./StatusTypes";

/**
 * Fetches the status of a generic HTTP endpoint by testing if it returns a 200 status code
 * @param {string} endpoint - The endpoint to fetch the status from
 * @return {Promise<StatusReturn>} - The status of the endpoint
 */
export async function fetchFromGenericHttp(
	endpoint: string,
): Promise<StatusReturn> {
	try {
		const response = await axios.get(endpoint, {
			validateStatus: () => true,
			timeout: 10000,
		});

		if (response.status === 200) {
			return {
				status: "OK",
			};
		}

		return {
			status: "DOWN",
			problemDescription: `HTTP status code ${response.status} received instead of 200`,
		};
	} catch (error) {
		let problemDescription = "Unknown error occurred";

		if (axios.isAxiosError(error)) {
			if (error.code === "ECONNABORTED") {
				problemDescription = "Request timed out after 10 seconds";
			} else if (error.request) {
				problemDescription = "No response received from the endpoint";
			} else {
				problemDescription = error.message;
			}
		}

		return {
			status: "DOWN",
			problemDescription,
		};
	}
}
