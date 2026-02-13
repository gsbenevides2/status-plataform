import { fetchFromAtlassianStatuspage } from "./AtlasianStatus";
import { fetchFromGenericHttp } from "./GenericHttpStatus";
import { fetchFromIncidentIoStatus } from "./IncidentStatus";
import { fetchFromInstatusStatuspage } from "./InStatusStatus";

export type StatusReturn =
	| {
			status: "OK";
	  }
	| {
			status: "DOWN";
			problemDescription: string;
	  };

export type Service = {
	name: string;
	endpoint: string;
	statusPage: string;
	fetcher: Fetcher;
};
export type Fetcher = "incident" | "instatus" | "atlassian" | "generic";

export const Fetchers = {
	incident: fetchFromIncidentIoStatus,
	atlassian: fetchFromAtlassianStatuspage,
	instatus: fetchFromInstatusStatuspage,
	generic: fetchFromGenericHttp,
} as const;

export type ServiceResponse = {
	name: string;
	status: "OK" | "DOWN";
	problemDescription: string;
	statusPage: string;
};
