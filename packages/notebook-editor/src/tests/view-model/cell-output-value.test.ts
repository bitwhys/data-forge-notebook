import { CellOutputValueViewModel } from "../../view-model/cell-output-value";
import { expectEventRaised } from "../lib/utils";

describe("view-model / cell-output-value", () => {

    test("can construct", () => {

        const displayType = "display-type";
        const data = {};
        const mockModel: any = {
            getDisplayType: () => displayType,
            getData: () => data,
        };
        const cellOutput = new CellOutputValueViewModel(mockModel);
        expect(cellOutput.getDisplayType()).toEqual(displayType);
        expect(cellOutput.getData()).toBe(data);
    });
});