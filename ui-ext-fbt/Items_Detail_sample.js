define(function () {
	// Detail View
	const VIEW_OITM_DETAIL = "fb229f12-b37f-4215-8550-df1889e5bf59";
	const VIEW_ORDR_DETAIL = "9b1eb386-3b4e-4570-98e4-4044008cd415";

	// Header
	const HEADER_CardCode = "52709261-0eec-4e71-a9fd-7fff3a142750";
	const HEADER_ItemCode = "51273dff-8ca7-4283-8264-95b199a1507e";

	// New controls
	// const UUID_PartnerSection = "uuid_partner_section";
	const UUID_MyGrid = "uuid_my_grid";
	const UUID_BTN_MyGrid_Order = "uuid_my_grid_order";
	const UUID_BTN_MyGrid_AddLine = "uuid_my_grid_addline";
	const UUID_ItemPic = "uuid_column_U_ItemPic_Property";
	const UUID_ItemNo = "uuid_column_U_ItemNo_Property";
	const UUID_ItemDesc = "uuid_column_U_ItemDesc_Property";

	// Header
	const HEADER_DocDueDate = "0ddd3f85-c8b8-41de-86be-05623195eb28";

	// Grid
	const UUID_RDR1 = "b5695427-62ce-40fd-9801-e4b6bbf9d37e";
	const UUID_RDR1_ItemCode = "COLUMN_45d54b9e-0dba-4fda-8351-0b6140ffb3b4";

	const SECTION_CONTENTS = "cbc0ee9f-d53e-43fd-a906-2f4e7d5f9506";
	const ITEM_SERVICE_TYPE = "e55b70b2-aa50-4fb4-95f7-3fc99c5af2a1";

	var relatedItems;
	var sItemCode;

	/**
	 * Get last day of current month
	 * @private
	 */
	let getLastDay = function () {
		let now = new Date();
		let y = now.getFullYear();
		let m = now.getMonth() + 1;
		let d = new Date(y, m, 0).getDate();
		m = m < 10 ? "0" + m : m;
		let lastDay = y.toString() + m.toString() + d.toString();
		return lastDay;
	};
	/**
	 * Load Related Items based on Item No. from the header of Item Master Data
	 * Parameter: oInst (the object exposed by Web Client UI API framework)
	 */
	async function loadItem(oInst) {
		// get Item No. from the header of Item Master Data
		sItemCode = await oInst
			.ActiveView(VIEW_OITM_DETAIL)
			.TextInput(HEADER_ItemCode)
			.getValue();
		// check if Item Code is valid
		if (sItemCode !== undefined && sItemCode !== null && sItemCode.length > 0) {
		
			let myGrid = oInst.ActiveView(VIEW_OITM_DETAIL).Grid(UUID_MyGrid);
			let btnAddLine = myGrid.Button(UUID_BTN_MyGrid_AddLine);
			// send service layer call to get top 4 Related Items
			let queryUrl =
				"/svcl/b1s/v1/RelatedItem?$filter=U_ItemCode eq '" +
				sItemCode +
				"'" +
				"&$orderby=U_RelatedItemCode&$top=4";
			let resp = await fetch(queryUrl, {
				method: "GET",
				credentials: "include"
			});
			relatedItems = await resp.json();
			// set result to new grid except for main item
			for (let iItemIndex = 0; iItemIndex < relatedItems.value.length; iItemIndex++) {
				await btnAddLine.click();
				let queryUrl =
					"/svcl/b1s/v1/Items?$select=Picture,ItemCode,ItemName&$filter=ItemCode eq '" +
					relatedItems.value[iItemIndex].U_RelatedItemCode +
					"'";
				let resp = await fetch(queryUrl, {
					method: "GET",
					credentials: "include"
				});
				let curRelatedItem = await resp.json();
				await myGrid
					.Row(iItemIndex)
					.TextInput(UUID_ItemNo)
					.setValue(curRelatedItem.value[0].ItemCode);
				await myGrid
					.Row(iItemIndex)
					.TextInput(UUID_ItemDesc)
					.setValue(curRelatedItem.value[0].ItemName);
				await myGrid
					.Row(iItemIndex)
					.Image(UUID_ItemPic)
					.setValue(curRelatedItem.value[0].Picture);
			}
		} else {
			oInst.showMessageBox("Warning", "Please input Item No. first", [{
				label: "OK",
				key: "OK"
			}]);
		}
	}

	async function createOrder(oInst) {
		let myGrid = oInst.ActiveView(VIEW_OITM_DETAIL).Grid(UUID_MyGrid);
		let selectedIndices = await myGrid.getSelectedIndices();

		await oInst.navigate("Detail", "ORDR");
		let oDetailView = oInst.ActiveView(VIEW_ORDR_DETAIL);

		let oCardCode = oDetailView.StringInput(HEADER_CardCode);
		await oCardCode.setValue("C26000");

		let oDeliveryDate = oDetailView.DatePicker(HEADER_DocDueDate);
		await oDeliveryDate.setValue(getLastDay());

		await oDetailView.Section(SECTION_CONTENTS).select();

		let oType = oDetailView.DropdownList(ITEM_SERVICE_TYPE);
		await oType.setValue("I");

		let oRDR1Grid = oDetailView.Grid(UUID_RDR1);
		await oRDR1Grid
			.Row(0)
			.CFL(UUID_RDR1_ItemCode)
			.setValue(sItemCode);
		for (let i = 0; i < selectedIndices.length; i++) {
			let oItemCode = relatedItems.value[selectedIndices[i]].U_RelatedItemCode;
			await oRDR1Grid
				.Row(i + 1)
				.CFL(UUID_RDR1_ItemCode)
				.setValue(oItemCode);
		}
	}

	// Event names
	const onAfterFormOpen = `OnAfterOpenForm`;
	const onAfterButtonClickBtnCreateOrder = `on${UUID_BTN_MyGrid_Order}AfterButtonClick`;

	return {
		[onAfterFormOpen]: async function (oInst) {
			await loadItem(oInst);
		},
		[onAfterButtonClickBtnCreateOrder]: async function (oInst) {
			await createOrder(oInst);
		},
		layout: {
			properties: [{
				label: "x string",
				name: "X_MYGRID1",
				type: "ONE2MANY",
				properties: [{
						name: "myItemPic",
						type: "PICTURE"
					},
					{
						name: "myItemNo",
						type: "STRING"
					},
					{
						name: "myItemDesc",
						type: "STRING"
					}
				]
			}]
		}
	};
});