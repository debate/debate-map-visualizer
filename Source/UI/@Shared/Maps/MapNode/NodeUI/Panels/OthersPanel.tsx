import {GetEntries, E, OmitIfFalsy} from "js-vextensions";
import {Fragment} from "react";
import {Button, CheckBox, Column, Div, Pre, Row, Select, Text} from "react-vcomponents";
import {BaseComponent, BaseComponentPlus} from "react-vextensions";
import {ShowMessageBox} from "react-vmessagebox";
import {IDAndCreationInfoUI} from "Source/UI/@Shared/CommonPropUIs/IDAndCreationInfoUI";
import {UUIDPathStub, UUIDStub} from "Source/UI/@Shared/UUIDStub";
import {ES} from "Source/Utils/UI/GlobalStyles";
import {SlicePath} from "mobx-firelink";
import {Map} from "Subrepos/Server/Source/@Shared/Store/firebase/maps/@Map";
import {Observer, InfoButton, Icon} from "vwebapp-framework";
import {MapNodeL3, ClaimForm} from "Subrepos/Server/Source/@Shared/Store/firebase/nodes/@MapNode";
import {AttachmentType, GetAttachmentType} from "Subrepos/Server/Source/@Shared/Store/firebase/nodeRevisions/@AttachmentType";
import {MeID} from "Subrepos/Server/Source/@Shared/Store/firebase/users";
import {GetUserPermissionGroups, IsUserCreatorOrMod} from "Subrepos/Server/Source/@Shared/Store/firebase/users/$user";
import {GetParentNodeL3, GetNodeMirrorChildren, GetParentNodeID} from "Subrepos/Server/Source/@Shared/Store/firebase/nodes";
import {MapNodeType} from "Subrepos/Server/Source/@Shared/Store/firebase/nodes/@MapNodeType";
import {CanConvertFromClaimTypeXToY, ChangeClaimType} from "Subrepos/Server/Source/@Shared/Commands/ChangeClaimType";
import {ArgumentType} from "Subrepos/Server/Source/@Shared/Store/firebase/nodes/@MapNodeRevision";
import {IsSinglePremiseArgument, GetNodeDisplayText, GetNodeL3, GetNodeForm} from "Subrepos/Server/Source/@Shared/Store/firebase/nodes/$node";
import {ChangeNodeOwnerMap} from "Subrepos/Server/Source/@Shared/Commands/ChangeNodeOwnerMap";
import {ReverseArgumentPolarity} from "Subrepos/Server/Source/@Shared/Commands/ReverseArgumentPolarity";
import {UpdateLink} from "Subrepos/Server/Source/@Shared/Commands/UpdateLink";
import {UpdateNodeChildrenOrder} from "Subrepos/Server/Source/@Shared/Commands/UpdateNodeChildrenOrder";

@Observer
export class OthersPanel extends BaseComponentPlus({} as {map?: Map, node: MapNodeL3, path: string}, {convertToType: null as AttachmentType}) {
	render() {
		const {map, node, path} = this.props;
		let {convertToType} = this.state;

		const mapID = map ? map._key : null;
		const userID = MeID();
		const _ = GetUserPermissionGroups(userID);
		//const creator = GetUser(node.creator);
		// viewers: GetNodeViewers(node._key),
		const creatorOrMod = IsUserCreatorOrMod(userID, node);

		const parent = GetParentNodeL3(path);
		const parentPath = SlicePath(path, 1);
		const parentCreatorOrMod = IsUserCreatorOrMod(userID, parent);

		const nodeArgOrParentSPArg_controlled = (node.type == MapNodeType.Argument && creatorOrMod ? node : null)
			|| (parent && parent.type === MapNodeType.Argument && parentCreatorOrMod ? parent : null);
		const nodeArgOrParentSPArg_controlled_path = nodeArgOrParentSPArg_controlled && (nodeArgOrParentSPArg_controlled === node ? path : parentPath);

		const convertToTypes = GetEntries(AttachmentType).filter(pair=>CanConvertFromClaimTypeXToY(GetAttachmentType(node), pair.value));
		convertToType = convertToType || convertToTypes.map(a=>a.value).FirstOrX();

		const isArgument_any = node.current.argumentType === ArgumentType.Any;
		/* const parents = GetNodesByIDs(node.parents?.VKeys() ?? []);
		const parentsArePrivateInSameMap = !IsSpecialEmptyArray(parents) && mapID && parents.All((a) => a.ownerMapID == mapID);
		const canChangeOwnershipType = creatorOrMod && (
			node.ownerMapID == null
				// if making private, node must be in a private map, and all its parents must be private nodes within that map (to ensure we don't leave links in other maps, which would make the owner-map-id invalid)
				? (mapID && map.type == MapType.Private && parentsArePrivateInSameMap)
				// if making public, can't be root node, and the owner map must allow public nodes (at some point, may remove this restriction, by having action cause node to be auto-replaced with in-map private-copy)
				: (node.parents?.VKeys().length > 0) // && map.allowPublicNodes)
		); */

		const argumentWrapper = IsSinglePremiseArgument(parent) ? parent : null;

		const changeControlType_currentType = node.ownerMapID != null ? "Private" : "Public";
		// const changeControlType_newType = changeControlType_currentType == 'Private' ? 'Public' : 'Private';
		const changeControlTypeCommand = new ChangeNodeOwnerMap(E({nodeID: node._key, newOwnerMapID: node.ownerMapID != null ? null : mapID, argumentNodeID: OmitIfFalsy(argumentWrapper?._key)}));

		let mirrorChildren = GetNodeMirrorChildren(node._key);
		return (
			<Column sel style={{position: "relative"}}>
				<IDAndCreationInfoUI id={node._key} creatorID={node.creator} createdAt={node.createdAt}/>
				<Row style={{flexWrap: "wrap"}}>
					<Text>Parents: </Text>
					{node.parents == null ? "none" : node.parents.VKeys().map((parentID, index)=>{
						return <Fragment key={index}>
							{index != 0 && <Text>, </Text>}
							<UUIDStub id={parentID}/>
						</Fragment>;
					})}
				</Row>
				<Row style={{flexWrap: "wrap"}}>
					<Text>Children: </Text>
					{node.children == null ? "none" : node.children.VKeys().map((childID, index)=>{
						return <Fragment key={index}>
							{index != 0 && <Text>, </Text>}
							<UUIDStub id={childID}/>
						</Fragment>;
					})}
				</Row>
				<Row style={{flexWrap: "wrap"}}>
					<Text>Mirror children: </Text>
					{mirrorChildren.length == 0 ? "none" : mirrorChildren.map(a=>a._key).map((childID, index)=>{
						return <Fragment key={index}>
							{index != 0 && <Text>, </Text>}
							<UUIDStub id={childID}/>
						</Fragment>;
					})}
				</Row>
				<Row center>
					<Text>Control type:</Text>
					<Select ml={5} options={["Private", "Public"]} value={changeControlType_currentType} enabled={changeControlTypeCommand.Validate_Safe() == null} title={changeControlTypeCommand.validateError} onChange={val=>{
						changeControlTypeCommand.Run();
					}}/>
					<InfoButton ml={5} text="Private nodes are locked to a given map, but allow more permission controls to the node-creator and map-editors."/>
				</Row>
				{/* <Row>Viewers: {viewers.length || '...'} <InfoButton text="The number of registered users who have had this node displayed in-map at some point."/></Row> */}
				{nodeArgOrParentSPArg_controlled &&
					<Row>
						<Button mt={3} text="Reverse argument polarity" onLeftClick={()=>{
							ShowMessageBox({
								title: "Reverse argument polarity?", cancelButton: true,
								// message: `Reverse polarity of argument "${GetNodeDisplayText(nodeArgOrParentSPArg_controlled)}"?\n\nAll relevance ratings will be deleted.`,
								message: `Reverse polarity of argument "${GetNodeDisplayText(nodeArgOrParentSPArg_controlled)}"?`,
								onOK: ()=>{
									new ReverseArgumentPolarity(E(mapID && {mapID}, {nodeID: nodeArgOrParentSPArg_controlled._key, path: nodeArgOrParentSPArg_controlled_path})).Run();
								},
							});
						}}/>
					</Row>}
				{node.type == MapNodeType.Claim && convertToTypes.length > 0 &&
					<Row center>
						<Pre>Convert to: </Pre>
						<Select options={convertToTypes} value={convertToType} onChange={val=>this.SetState({convertToType: val})}/>
						<Button ml={5} text="Convert" onClick={()=>{
							new ChangeClaimType(E({mapID, nodeID: node._key, newType: convertToType})).Run();
						}}/>
					</Row>}
				{node.type === MapNodeType.Argument && node.multiPremiseArgument && !isArgument_any &&
					<ChildrenOrder mapID={mapID} node={node}/>}
				<AtThisLocation node={node} path={path}/>
			</Column>
		);
	}
}

class AtThisLocation extends BaseComponent<{node: MapNodeL3, path: string}, {}> {
	render() {
		const {node, path} = this.props;
		if (path.split("/").length === 0) return <div/>; // if the root of a map, or subnode

		let canSetAsNegation;
		let canSetAsSeriesAnchor;
		if (node.type == MapNodeType.Claim) {
			const claimType = GetAttachmentType(node);
			canSetAsNegation = claimType === AttachmentType.None && node.link.form !== ClaimForm.YesNoQuestion;
			canSetAsSeriesAnchor = claimType === AttachmentType.Equation && !node.current.equation.isStep; // && !creating;
		}

		return (
			<Column mt={10}>
				<Row style={{fontWeight: "bold"}}>At this location:</Row>
				<Row style={{whiteSpace: "normal"}}>
					<Text>Path: </Text>
					<UUIDPathStub path={path}/>
				</Row>
				{canSetAsNegation &&
					<Row style={{display: "flex", alignItems: "center"}}>
						<Pre>Show as negation: </Pre>
						<CheckBox checked={node.link.form == ClaimForm.Negation}
							onChange={val=>{
								new UpdateLink({
									linkParentID: GetParentNodeID(path), linkChildID: node._key,
									linkUpdates: {form: val ? ClaimForm.Negation : ClaimForm.Base},
								}).Run();
							}}/>
					</Row>}
				{canSetAsSeriesAnchor &&
					<Row style={{display: "flex", alignItems: "center"}}>
						<Pre>Show as series anchor: </Pre>
						<CheckBox checked={node.link.seriesAnchor}
							// onChange={val=>Change(val ? newLinkData.isStep = true : delete newLinkData.isStep)}/>
							onChange={val=>{
								new UpdateLink({
									linkParentID: GetParentNodeID(path), linkChildID: node._key,
									linkUpdates: {seriesAnchor: val || null},
								}).Run();
							}}/>
					</Row>}
			</Column>
		);
	}
}

class ChildrenOrder extends BaseComponent<{mapID: string, node: MapNodeL3}, {}> {
	render() {
		const {mapID, node} = this.props;
		const oldChildrenOrder = node.childrenOrder || [];
		const oldChildrenOrderValid = oldChildrenOrder.length == node.children.VKeys().length && oldChildrenOrder.every(id=>node.children[id] != null);
		return (
			<Column mt={5}>
				<Row style={{fontWeight: "bold"}}>Children order:</Row>
				{oldChildrenOrder.map((childID, index)=>{
					const childPath = (node._key ? `${node._key}/` : "") + childID;
					const child = GetNodeL3(childPath);
					const childTitle = child ? GetNodeDisplayText(child, childPath, GetNodeForm(child, node)) : "...";
					return (
						<Row key={index} style={{alignItems: "center"}}>
							<Row mr={7} sel style={{opacity: 0.5}}>
								<Text>#</Text>
								<UUIDStub id={childID}/>
							</Row>
							<Div sel style={ES({flex: 1, whiteSpace: "normal"})}>{childTitle}</Div>
							{/* <TextInput enabled={false} style={ES({flex: 1})} required pattern={MapNode_id}
								value={`#${childID.toString()}: ${childTitle}`}
								//onChange={val=>Change(!IsNaN(val.ToInt()) && (newData.childrenOrder[index] = val.ToInt()))}
							/> */}
							<Button text={<Icon size={16} icon="arrow-up"/> as any} m={2} ml={5} style={{padding: 3}} enabled={index > 0}
								onClick={()=>{
									const newOrder = oldChildrenOrder.slice(0);
									newOrder.RemoveAt(index);
									newOrder.Insert(index - 1, childID);
									new UpdateNodeChildrenOrder({mapID, nodeID: node._key, childrenOrder: newOrder}).Run();
								}}/>
							<Button text={<Icon size={16} icon="arrow-down"/> as any} m={2} ml={5} style={{padding: 3}} enabled={index < oldChildrenOrder.length - 1}
								onClick={()=>{
									const newOrder = oldChildrenOrder.slice(0);
									newOrder.RemoveAt(index);
									newOrder.Insert(index + 1, childID);
									new UpdateNodeChildrenOrder({mapID, nodeID: node._key, childrenOrder: newOrder}).Run();
								}}/>
						</Row>
					);
				})}
				{!oldChildrenOrderValid &&
					<Button mr="auto" text="Fix children-order" onClick={()=>{
						const existingValidIDs = oldChildrenOrder.filter(id=>node.children[id] != null);
						const missingChildIDs = node.children.Pairs().filter(pair=>!oldChildrenOrder.Contains(pair.key)).map(pair=>pair.key);
						new UpdateNodeChildrenOrder({mapID, nodeID: node._key, childrenOrder: existingValidIDs.concat(missingChildIDs)}).Run();
					}}/>}
			</Column>
		);
	}
}