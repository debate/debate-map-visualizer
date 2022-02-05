import {Button, CheckBox, Column, DropDown, DropDownContent, DropDownTrigger, Pre, Row, RowLR, Select, Spinner} from "web-vcore/nm/react-vcomponents.js";
import {BaseComponentPlus} from "web-vcore/nm/react-vextensions.js";
import {GADDemo} from "UI/@GAD/GAD.js";
import {Button_GAD} from "UI/@GAD/GADButton.js";
import {store} from "Store";
import {runInAction} from "web-vcore/nm/mobx.js";
import {Observer, RunInAction, RunInAction_Set} from "web-vcore";
import {ACTEnsureMapStateInit} from "Store/main/maps";
import {Map} from "dm_common";
import React from "react";

const ratingPreviewOptions = [
	{name: "None", value: "none"},
	{name: "Bar (average)", value: "bar_average"},
	{name: "Chart", value: "chart"},
];

@Observer
export class LayoutDropDown extends BaseComponentPlus({} as {map: Map}, {}) {
	render() {
		const {map} = this.props;
		const {initialChildLimit} = store.main.maps;
		const {showReasonScoreValues} = store.main.maps;

		const Button_Final = GADDemo ? Button_GAD : Button;
		const splitAt = 210;
		return (
			<DropDown>
				<DropDownTrigger><Button_Final text="Layout" style={{height: "100%"}}/></DropDownTrigger>
				<DropDownContent style={{position: "fixed", right: 0, width: 350, borderRadius: "0 0 0 5px"}}><Column>
					<RowLR splitAt={splitAt}>
						<Pre>Initial child limit: </Pre>
						<Spinner min={1} style={{width: "100%"}} value={initialChildLimit} onChange={val=>{
							RunInAction_Set(this, ()=>store.main.maps.initialChildLimit = val);
						}}/>
					</RowLR>
					<RowLR splitAt={splitAt}>
						<Pre>Show Reason Score values: </Pre>
						<CheckBox value={showReasonScoreValues} onChange={val=>{
							RunInAction_Set(this, ()=>store.main.maps.showReasonScoreValues = val);
						}}/>
					</RowLR>
					<RowLR splitAt={splitAt}>
						<Pre>Toolbar rating previews: </Pre>
						<Select options={ratingPreviewOptions} value={store.main.maps.toolbarRatingPreviews} onChange={val=>{
							RunInAction_Set(this, ()=>store.main.maps.toolbarRatingPreviews = val);
						}}/>
					</RowLR>
					<Row mt={5}>
						<Button text="Clear map-view state" onClick={()=>{
							RunInAction_Set(this, ()=>{
								store.main.maps.mapViews.delete(map.id);
								ACTEnsureMapStateInit(map.id);
							});
						}}/>
					</Row>
				</Column></DropDownContent>
			</DropDown>
		);
	}
}