import {BaseComponentPlus} from "react-vextensions";
import {PageContainer, Observer} from "vwebapp-framework";
import {GetMap} from "Subrepos/Server/Source/@Shared/Store/firebase/maps";
import {globalMapID} from "Subrepos/Server/Source/@Shared/Store/firebase/nodes/@MapNode";
import {MapUI} from "../@Shared/Maps/MapUI";

@Observer
export class GlobalMapUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		const map = GetMap(globalMapID);
		if (map == null) return null;
		return (
			<PageContainer preset="full" style={{margin: 0}}>
				<MapUI map={map} subNavBarWidth={/* 104 */ 54}/>
			</PageContainer>
		);
	}
}