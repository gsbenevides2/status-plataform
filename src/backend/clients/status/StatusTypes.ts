import { fetchFromAtlassianStatuspage } from "./AtlasianStatus";
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
export type Fetcher = "incident" | "instatus" | "atlassian";

export const Fetchers = {
	incident: fetchFromIncidentIoStatus,
	atlassian: fetchFromAtlassianStatuspage,
	instatus: fetchFromInstatusStatuspage,
} as const;

export type ServiceResponse = {
	name: string;
	status: "OK" | "DOWN";
	problemDescription: string;
	statusPage: string;
};
