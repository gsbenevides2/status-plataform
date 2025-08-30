import { Elysia, StatusMap, t } from "elysia";
import { type Fetcher, Fetchers } from "../clients/status/StatusTypes";
import { PlatformService } from "../services/PlatformService";

export interface PlatformResponse {
	_id: string;
	name: string;
	url: string;
	type: string;
}

export const PlatformController = new Elysia({
	prefix: "/platform",
	detail: {
		tags: ["Platform"],
		description: "Platform management and status retrieval",
		security: [
			{
				headerAuth: [],
			},
		],
	},
})
	.get(
		"/platforms",
		async ({ status }) => {
			const platforms = await PlatformService.getPlatforms();
			const platformsResponse = platforms.map((platform) => ({
				_id: platform._id.toString(),
				name: platform.name,
				url: platform.url,
				type: platform.type.toString(),
			}));
			return status(StatusMap.OK, platformsResponse);
		},
		{
			detail: {
				summary: "Get all platforms",
				description: "Retrieves a list of all platforms",
			},
			response: {
				[StatusMap.OK]: t.Array(
					t.Object({
						_id: t.String({
							title: "ID",
							description: "The ID of the platform",
						}),
						name: t.String(),
						url: t.String(),
						type: t.String({
							title: "Type",
							description: "The type of the platform",
						}),
					}),
				),
			},
		},
	)
	.get(
		"/platforms/:id",
		async ({ status, params }) => {
			const { id } = params;
			const platform = await PlatformService.getPlatformById(id);
			if (!platform) {
				return status(StatusMap["Not Found"], {
					error: "Platform not found",
				});
			}
			return status(StatusMap.OK, {
				_id: platform._id.toString(),
				name: platform.name,
				url: platform.url,
				type: platform.type.toString(),
			});
		},
		{
			detail: {
				summary: "Get platform by ID",
				description: "Retrieves a platform by its ID",
			},
			params: t.Object({
				id: t.String({
					title: "Platform ID",
					description: "The ID of the platform to retrieve",
				}),
			}),
			response: {
				[StatusMap.OK]: t.Object(
					{
						_id: t.String({
							title: "ID",
							description: "The ID of the platform",
							examples: ["66c19f145412426feb644000"],
						}),
						name: t.String({
							title: "Name",
							description: "The name of the platform",
							examples: ["Google"],
						}),
						url: t.String({
							title: "URL",
							description: "The URL of the platform",
							examples: ["https://status.google.com"],
						}),
						type: t.String({
							title: "Type",
							description: "The type of the platform",
							examples: ["atlassian"],
						}),
					},
					{
						title: "Platform",
						description: "The platform with the given ID",
					},
				),
				[StatusMap["Not Found"]]: t.Object(
					{
						error: t.String({
							title: "Error",
							description: "Error message",
							examples: ["Platform not found"],
						}),
					},
					{
						title: "Platform not found",
						description: "The platform with the given ID was not found",
					},
				),
			},
		},
	)
	.post(
		"/platforms",
		async ({ status, body }) => {
			const platform = body;
			if (!Object.keys(Fetchers).includes(platform.type)) {
				return status(StatusMap["Bad Request"], {
					error: "Invalid platform type",
				});
			}
			const insertedId = await PlatformService.createPlatform({
				...platform,
				type: platform.type as Fetcher,
			});
			return status(StatusMap.Created, {
				insertedId: insertedId.toString(),
			});
		},
		{
			detail: {
				summary: "Create a new platform",
				description: "Creates a new platform and returns its ID",
			},
			body: t.Object({
				name: t.String({
					title: "Name",
					description: "The name of the platform",
					examples: ["Google"],
				}),
				url: t.String({
					title: "URL",
					description: "The URL of the platform",
					examples: ["https://status.google.com"],
				}),
				type: t.String({
					enum: Object.keys(Fetchers),
					examples: ["atlassian"],
				}),
			}),
			response: {
				[StatusMap.Created]: t.Object(
					{
						insertedId: t.String({
							title: "Inserted ID",
							description: "The ID of the newly created platform",
							examples: ["66c19f145412426feb644000"],
						}),
					},
					{
						title: "Created",
						description: "The platform was created successfully",
					},
				),
				[StatusMap["Bad Request"]]: t.Object(
					{
						error: t.String({
							title: "Error",
							description: "Error message",
							examples: ["Invalid platform type"],
						}),
					},
					{
						title: "Bad Request",
						description: "The platform type is invalid",
					},
				),
			},
		},
	)
	.get(
		"/fetchers",
		async ({ status }) => {
			const fetchers = await PlatformService.getFetchersList();
			return status(StatusMap.OK, fetchers);
		},
		{
			detail: {
				summary: "Get fetchers list",
				description: "Retrieves a list of all available fetchers",
			},
			response: {
				[StatusMap.OK]: t.Array(
					t.String({
						title: "Fetcher",
						description: "The fetcher name",
						examples: ["incident", "instatus", "atlassian"],
					}),

					{
						title: "Fetchers list",
						description: "The list of all available fetchers",
					},
				),
			},
		},
	)
	.get(
		"/status",
		async ({ status }) => {
			const allStatus = await PlatformService.getAllStatus();
			const response = allStatus.map((status) => ({
				name: status.name,
				status: status.status.toString(),
				problemDescription: status.problemDescription,
				statusPage: status.statusPage,
			}));
			return status(StatusMap.OK, response);
		},
		{
			detail: {
				summary: "Get all platform statuses",
				description: "Retrieves the status of all platforms",
			},
			response: {
				[StatusMap.OK]: t.Array(
					t.Object({
						name: t.String({
							title: "Name",
							description: "The name of the platform",
							examples: ["Google"],
						}),
						status: t.String({
							title: "Status",
							description: "The status of the platform",
							examples: ["OK", "DOWN"],
						}),
						problemDescription: t.String({
							title: "Problem Description",
							description: "The problem description of the platform",
							examples: ["Google is down"],
						}),
						statusPage: t.String({
							title: "Status Page",
							description: "The status page of the platform",
							examples: ["https://status.google.com"],
						}),
					}),
					{
						title: "Platform Statuses",
						description: "The status of all platforms",
					},
				),
			},
		},
	)
	.delete(
		"/platforms/:id",
		async ({ status, params }) => {
			const { id } = params;
			await PlatformService.deletePlatform(id);
			return status(StatusMap["No Content"], undefined);
		},
		{
			detail: {
				summary: "Delete a platform",
				description: "Deletes a platform by its ID",
			},
			response: {
				[StatusMap["No Content"]]: t.Undefined({
					title: "No Content",
					description: "The platform was deleted successfully",
				}),
			},
			params: t.Object({
				id: t.String({
					title: "Platform ID",
					description: "The ID of the platform to delete",
				}),
			}),
		},
	)
	.post(
		"/platforms/:id",
		async ({ status, params, body }) => {
			const { id } = params;
			if (!Object.keys(Fetchers).includes(body.type)) {
				return status(StatusMap["Bad Request"], {
					error: "Invalid platform type",
				});
			}
			await PlatformService.updatePlatform(id, {
				...body,
				type: body.type as Fetcher,
			});
			return status(StatusMap.OK, undefined);
		},
		{
			detail: {
				summary: "Update a platform",
				description: "Updates a platform by its ID",
			},
			body: t.Object({
				name: t.String({
					title: "Name",
					description: "The name of the platform",
				}),
				url: t.String({
					title: "URL",
					description: "The URL of the platform",
				}),
				type: t.String({
					enum: Object.keys(Fetchers),
					examples: ["atlassian"],
				}),
			}),
			response: {
				[StatusMap.OK]: t.Undefined({
					title: "OK",
					description: "The platform was updated successfully",
				}),
				[StatusMap["Bad Request"]]: t.Object({
					error: t.String({
						title: "Error",
						description: "Error message",
						examples: ["Invalid platform type"],
					}),
				}),
			},
			params: t.Object({
				id: t.String({
					title: "Platform ID",
					description: "The ID of the platform to update",
				}),
			}),
		},
	)
	.as("scoped");
