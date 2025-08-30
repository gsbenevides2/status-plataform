import { MongoClient, ObjectId } from "mongodb";
import { getEnv } from "../../utils/getEnv";
import {
	type Fetcher,
	Fetchers,
	type ServiceResponse,
} from "../clients/status/StatusTypes";

export interface Platform {
	_id: ObjectId;
	name: string;
	url: string;
	type: Fetcher;
}

const mongoClient = await MongoClient.connect(getEnv("MONGO_URI"), {
	authSource: "status",
});
const db = mongoClient.db("status");
const collection = db.collection<Platform>("platforms");

export class PlatformService {
	static async createPlatform(platform: Omit<Platform, "_id">) {
		const result = await collection.insertOne({
			...platform,
			_id: new ObjectId(),
		});
		return result.insertedId;
	}

	static async getPlatforms() {
		const platforms = await collection.find().toArray();
		return platforms;
	}

	static async getPlatformById(id: string) {
		const platform = await collection.findOne({ _id: new ObjectId(id) });
		return platform;
	}

	static async getFetchersList() {
		return Object.keys(Fetchers);
	}

	static async getAllStatus() {
		const platforms = await PlatformService.getPlatforms();
		const status = await Promise.allSettled(
			platforms.map((platform) => {
				const fetcher = Fetchers[platform.type];
				return fetcher(platform.url);
			}),
		);
		console.log("status", status);
		return status
			.map((result, index) => {
				const platform = platforms[index];
				if (result.status === "fulfilled") {
					return {
						name: platform.name,
						status: result.value.status,
						problemDescription:
							result.value.status === "DOWN"
								? result.value.problemDescription
								: "No problem description available",
						statusPage: platform.url,
					};
				}
				return null;
			})
			.filter(Boolean) as ServiceResponse[];
	}

	static async deletePlatform(id: string) {
		await collection.deleteOne({ _id: new ObjectId(id) });
	}

	static async updatePlatform(id: string, platform: Omit<Platform, "_id">) {
		await collection.updateOne({ _id: new ObjectId(id) }, { $set: platform });
	}
}
