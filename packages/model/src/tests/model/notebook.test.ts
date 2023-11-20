import { ICell, CellType } from "../../model/cell";
import { Notebook } from "../../model/notebook";

describe("model / notebook", () => {

    test("can construct", () => {

        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = new Notebook(theNodeJsVersion, theLanguage, [], undefined);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual(theLanguage);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can serialize", () => {
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = new Notebook(theNodeJsVersion, theLanguage, [], undefined);
        expect(notebook.serialize()).toEqual({
            version: 3,
            language: theLanguage,
            nodejs: theNodeJsVersion,
            cells: [],
        });
    });

    test("can deserialize", () => {
        const theLanguage = "javascript";
        const theNodeJsVersion = "v10.0.0";
        const notebook = Notebook.deserialize({
            version: 3,
            nodejs: theNodeJsVersion,
            language: theLanguage,
            cells: [],
        });
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual(theLanguage);
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can deserialize with undefined cells", () => {
        const theNodeJsVersion = "v10.0.0";
        const notebook = Notebook.deserialize({
            version: 3,
            nodejs: theNodeJsVersion,
            language: undefined,
            cells: undefined,
        } as any);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual("javascript");
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can deserialize with cells", () => {
        
        const serializedCell: any = {};
        const notebook = Notebook.deserialize({
            version: 3,
            language: "",
            cells: [
                serializedCell,
            ],
        });
        expect(notebook.getCells().length).toEqual(1);
        expect(notebook.getCells()[0]).toBeDefined();
    });

    test("can deserialize with sheet", () => {
        const theNodeJsVersion = "v10.0.0";
        const notebook = Notebook.deserialize({
            version: 2,
            nodejs: theNodeJsVersion,
            sheet: {
                id: "1234",
                language: undefined,
                cells: [],
            },
        } as any);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual("javascript");
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can deserialize with sheet and undeifned cells", () => {
        const theNodeJsVersion = "v10.0.0";
        const notebook = Notebook.deserialize({
            version: 2,
            nodejs: theNodeJsVersion,
            sheet: {
                id: "1234",
                language: undefined,
                cells: undefined,
            },
        } as any);
        expect(notebook.getInstanceId().length).toBeGreaterThan(0);
        expect(notebook.getLanguage()).toEqual("javascript");
        expect(notebook.getCells()).toEqual([]);
        expect(notebook.getNodejsVersion()).toEqual(theNodeJsVersion);
    });

    test("can add first cell", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell: any = {};
        notebook.addCell(0, mockCell);

        expect(notebook.getCells()).toEqual([ mockCell ]);
    });

    test("can add second cell", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {};
        const mockCell2: any = {};
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);

        expect(notebook.getCells()).toEqual([ mockCell1, mockCell2 ]);
    });

    test("can add second cell at start", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {};
        const mockCell2: any = {};
        notebook.addCell(0, mockCell1);
        notebook.addCell(0, mockCell2);

        expect(notebook.getCells()).toEqual([ mockCell2, mockCell1 ]);
    });

    test("can add cell in the middle", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {};
        const mockCell2: any = {};
        const mockCell3: any = {};
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);
        notebook.addCell(1, mockCell3);

        expect(notebook.getCells()).toEqual([ mockCell1, mockCell3, mockCell2 ]);
    });

    test("throws when adding a cell beyond the range", () => {

        const notebook = new Notebook("", "", [], undefined);
        expect(() => notebook.addCell(1, {} as any))
            .toThrow();
    });

    test("can delete cell", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {
            getId: () => "A1",
        };
        const mockCell2: any = {
            getId: () => "A2",
        };
        const mockCell3: any = {
            getId: () => "A3",
        };
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);
        notebook.addCell(2, mockCell3);
        notebook.deleteCell("A2")

        expect(notebook.getCells()).toEqual([ mockCell1, mockCell3 ]);
    });

    test("throws when deleting a cell that doesn't exist", () => {

        const notebook = new Notebook("", "", [], undefined);
        expect(() => notebook.deleteCell("non-exist-cell"))
            .toThrow();
    });

    test("can move cell to end", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {};
        const mockCell2: any = {};
        const mockCell3: any = {};
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);
        notebook.addCell(2, mockCell3);
        notebook.moveCell(0, 2)

        expect(notebook.getCells()).toEqual([ mockCell2, mockCell3, mockCell1 ]);
    });

    test("can move cell to start", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {};
        const mockCell2: any = {};
        const mockCell3: any = {};
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);
        notebook.addCell(2, mockCell3);
        notebook.moveCell(2, 0)

        expect(notebook.getCells()).toEqual([ mockCell3, mockCell1, mockCell2 ]);
    });

    test("can move cell to middle", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {};
        const mockCell2: any = {};
        const mockCell3: any = {};
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);
        notebook.addCell(2, mockCell3);
        notebook.moveCell(0, 1)

        expect(notebook.getCells()).toEqual([ mockCell2, mockCell1, mockCell3 ]);
    });

    test("can find cell by id", () => {
        
        const notebook = new Notebook("", "", [], undefined);

        const mockCell1: any = {
            getId: () => "A1",
        };
        const mockCell2: any = {
            getId: () => "A2",
        };
        const mockCell3: any = {
            getId: () => "A3",
        };
        notebook.addCell(0, mockCell1);
        notebook.addCell(1, mockCell2);
        notebook.addCell(2, mockCell3);
        
        const cell = notebook.findCell("A2");
        expect(cell).toEqual(mockCell2);
    });

    test("returns undefined when finding a cell that doesn't exist", () => {

        const notebook = new Notebook("", "", [], undefined);
        expect(notebook.findCell("non-existing-cell")).toBeUndefined();
    });

    test("can set nodejs version", () => {

        const notebook = new Notebook("", "", [], undefined);

        expect(notebook.getNodejsVersion()).toBe("");

        const theVersion = "v12";
        notebook.setNodejsVersion(theVersion);
        expect(notebook.getNodejsVersion()).toBe(theVersion);
    });
});
