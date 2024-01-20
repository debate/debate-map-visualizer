import {GetTimelines, GetTimelineStep, GetTimelineSteps, Map, MeID} from "dm_common";
import React from "react";
import {GetMapState, GetSelectedTimeline} from "Store/main/maps/mapStates/$mapState.js";
import {MapUIWaitMessage} from "UI/@Shared/Maps/MapUIWrapper.js";
import {ShowSignInPopup} from "UI/@Shared/NavBar/UserPanel.js";
import {ShowAddTimelineDialog} from "UI/@Shared/Timelines/AddTimelineDialog.js";
import {RunCommand_DeleteTimeline} from "Utils/DB/Command";
import {liveSkin} from "Utils/Styles/SkinManager";
import {ES, Observer, RunInAction, RunInAction_Set} from "web-vcore";
import {E} from "web-vcore/nm/js-vextensions.js";
import {Button, Column, DropDown, DropDownContent, DropDownTrigger, Pre, Row, Text, Spinner, CheckBox} from "web-vcore/nm/react-vcomponents.js";
import {BaseComponent, BaseComponentPlus} from "web-vcore/nm/react-vextensions.js";
import {ScrollView} from "web-vcore/nm/react-vscrollview.js";
import {store} from "Store";
import {zIndexes} from "Utils/UI/ZIndexes";
import {RecordDropdown} from "./PlayingSubpanel/RecordDropdown";

@Observer
export class Header1 extends BaseComponent<{map: Map}, {}> {
	timelineSelect: DropDown|n;
	render() {
		const {map} = this.props;
		const uiState = store.main.timelines;
		const mapState = GetMapState(map.id);
		if (mapState == null) return null; // should load shortly

		const timelines = GetTimelines(map.id);
		const timeline = GetSelectedTimeline(map.id);
		const steps = timeline ? GetTimelineSteps(timeline.id) : null;

		return (
			<Row>
				<Text>Timeline:</Text>
				<DropDown ref={c=>this.timelineSelect = c}>
					<DropDownTrigger><Button ml={5} text={timeline ? timeline.name : "[none]"}/></DropDownTrigger>
					<DropDownContent style={{position: "fixed", left: 0, padding: null, background: null, borderRadius: null, zIndex: 1}}>
						<Row style={{alignItems: "flex-start"}}>
							<Column style={{width: 600}}>
								<Row>
									<Text>Timelines:</Text>
									<Button ml={5} mdIcon="plus" title="Add new timeline" onClick={e=>{
										const meID = MeID();
										if (meID == null) return ShowSignInPopup();
										ShowAddTimelineDialog(meID, map.id);
									}}/>
								</Row>
								<ScrollView style={ES({flex: 1})} contentStyle={{flex: 0.8, position: "relative", maxHeight: 500}}>
									{timelines.map((timeline2, index)=>(
										<Column key={index} p="7px 10px"
											style={E(
												{
													cursor: "pointer",
													background: liveSkin.BasePanelBackgroundColor().darken(index % 2 == 0 ? 1 : 0).css(),
												},
												index == timelines.length - 1 && {borderRadius: "0 0 10px 10px"},
											)}
											onClick={()=>{
												if (mapState) RunInAction("CollectionSubpanel.selectedTimeline.onChange", ()=>mapState.selectedTimeline = timeline2.id);
												if (this.timelineSelect) this.timelineSelect.Hide();
											}}>
											<Row style={{alignItems: "center"}}>
												<Pre>{timeline2.name}</Pre>
												<span style={{marginLeft: 5, fontSize: 11}}>(id: {timeline2.id})</span>
												<Button ml="auto" mdIcon="delete" style={{margin: "-5px 0"}} title="Delete timeline (timeline must be selected, and have all its steps deleted)"
													enabled={timeline2.id == timeline?.id && timeline != null && steps != null && steps.length == 0}
													onClick={async()=>{
														if (timeline == null) return;
														await RunCommand_DeleteTimeline({id: timeline.id});
													}}/>
											</Row>
										</Column>
									))}
								</ScrollView>
							</Column>
						</Row>
					</DropDownContent>
				</DropDown>
				{/*<Button ml="auto" text="Play" title="Start playing this timeline" enabled={selectedTimeline != null} style={{ flexShrink: 0 }} onClick={() => {
					store.dispatch(new ACTMap_PlayingTimelineSet({ mapID: map.id, timelineID: selectedTimeline.id }));
					store.dispatch(new ACTMap_PlayingTimelineStepSet({ mapID: map.id, stepIndex: 0 }));
					store.dispatch(new ACTMap_PlayingTimelineAppliedStepSet({ mapID: map.id, stepIndex: null }));
				}}/>*/}

				<Row ml="auto" style={{position: "relative"}}>
					<CheckBox text="Details" value={mapState.showTimelineDetails} onChange={val=>RunInAction_Set(this, ()=>mapState.showTimelineDetails = val)}/>
					<CheckBox ml={5} text="Edit mode" value={mapState.timelineEditMode} onChange={val=>RunInAction_Set(this, ()=>mapState.timelineEditMode = val)}/>
					<CheckBox ml={5} text="Audio mode" title="Special UI mode, where map-ui is replaced with panel where audio file can be dragged and viewed, for splicing onto timeline-steps."
						value={uiState.audioMode} onChange={val=>RunInAction_Set(this, ()=>uiState.audioMode = val)}/>
					<RecordDropdown/>
					<OptionsDropdown/>
				</Row>
			</Row>
		);
	}
}

@Observer
class OptionsDropdown extends BaseComponent<{}, {}> {
	render() {
		const uiState = store.main.timelines;
		const uiState_maps = store.main.maps;
		return (
			<DropDown>
				<DropDownTrigger><Button ml={5} text="Options" style={{height: "100%"}}/></DropDownTrigger>
				<DropDownContent style={{right: 0, width: 300, zIndex: zIndexes.subNavBar}}><Column>
					<Row style={{fontWeight: "bold"}}>Editing</Row>
					<CheckBox text="Lock map scrolling" title="Lock map edge-scrolling. (for dragging onto timeline steps)"
						value={uiState_maps.lockMapScrolling} onChange={val=>RunInAction_Set(this, ()=>uiState_maps.lockMapScrolling = val)}/>

					<Row mt={10} style={{fontWeight: "bold"}}>Playback</Row>
					<Row>
						<Text>Node-reveal highlight time:</Text>
						<Spinner ml={5} min={0} value={uiState.nodeRevealHighlightTime} onChange={val=>RunInAction_Set(this, ()=>uiState.nodeRevealHighlightTime = val)}/>
					</Row>
					<Row>
						<Text>Hide editing controls:</Text>
						<CheckBox ml={5} value={uiState.hideEditingControls} onChange={val=>RunInAction_Set(this, ()=>uiState.hideEditingControls = val)}/>
					</Row>
					<Row>
						<Text>Show focus-nodes:</Text>
						<CheckBox ml={5} value={uiState.showFocusNodes} onChange={val=>RunInAction_Set(this, ()=>uiState.showFocusNodes = val)}/>
					</Row>
					<Row>
						<Text>Layout-helper map:</Text>
						<CheckBox ml={5} text="Load" value={uiState.layoutHelperMap_load} onChange={val=>RunInAction_Set(this, ()=>uiState.layoutHelperMap_load = val)}/>
						<CheckBox ml={5} text="Show" value={uiState.layoutHelperMap_show} onChange={val=>RunInAction_Set(this, ()=>uiState.layoutHelperMap_show = val)}/>
					</Row>
				</Column></DropDownContent>
			</DropDown>
		);
	}
}