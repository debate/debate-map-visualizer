import {AddSchema, AssertValidate, NewSchema, GetSchemaJSON, GetAsync, Command, AssertV, CommandMeta} from "web-vcore/nm/mobx-graphlink.js";
import {CE} from "web-vcore/nm/js-vextensions.js";
import {MapEdit, UserEdit} from "../CommandMacros.js";


import {Map} from "../DB/maps/@Map.js";
import {GetMap} from "../DB/maps.js";
import {AssertUserCanModify} from "./Helpers/SharedAsserts.js";

type MainType = Map;
const MTName = "Map";

@MapEdit("id")
@UserEdit
@CommandMeta({
	payloadSchema: ()=>({
		properties: {
			id: {$ref: "UUID"},
			updates: NewSchema({
				properties: CE(GetSchemaJSON(MTName).properties!).Including("name", "note", "noteInline", "visibility", "defaultExpandDepth", "defaultTimelineID", "requireMapEditorsCanEdit", "nodeDefaults", "editorIDs"),
			}),
		},
		required: ["id", "updates"],
	}),
})
export class UpdateMapDetails extends Command<{id: string, updates: Partial<MainType>}, {}> {
	oldData: MainType;
	newData: MainType;
	Validate() {
		const {id: mapID, updates: mapUpdates} = this.payload;
		this.oldData = GetMap.NN(mapID);
		AssertUserCanModify(this, this.oldData);
		this.newData = {...this.oldData, ...mapUpdates};
		this.newData.editedAt = Date.now();
		AssertValidate(MTName, this.newData, `New ${MTName.toLowerCase()}-data invalid`);
	}

	DeclareDBUpdates(db) {
		const {id} = this.payload;
		db.set(`maps/${id}`, this.newData);
	}
}