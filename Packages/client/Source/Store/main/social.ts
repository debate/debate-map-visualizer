import {O} from "web-vcore";
import {makeObservable} from "web-vcore/nm/mobx";

export class SocialPageState {
	constructor() { makeObservable(this); }
	@O showAll = false;
}