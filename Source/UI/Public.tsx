import {BaseComponentPlus} from "react-vextensions";
import {MapType} from "Subrepos/Server/Source/@Shared/Store/firebase/maps/@Map";
import {MapListUI} from "./@Shared/Maps/MapListUI";

export class PublicUI extends BaseComponentPlus({} as {}, {}) {
	render() {
		return <MapListUI type={MapType.Public}/>;
	}
}