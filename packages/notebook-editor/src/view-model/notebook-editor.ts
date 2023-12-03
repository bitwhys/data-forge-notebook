import { InjectableClass, InjectProperty } from "@codecapers/fusion";
import { BasicEventHandler, IEventSource, EventSource, ILogId, ILog } from "utils";
import { CellType, ISerializedCell1 } from "model";
import { ISerializedNotebook1 } from "model";
import { IIdGenerator, IIdGeneratorId } from "utils/src/lib/id-generator";
import { INotebookRepository, INotebookRepositoryId, INotebookStorageId } from "storage";
import { INotebookViewModel, notebookVersion, NotebookViewModel } from "./notebook";
import * as path from "path";
import { IConfirmationDialog, IConfirmationDialogId } from "../services/confirmation-dialog";
import { INotification, INotificationId } from "../services/notification";
import { IEvaluatorClient, IEvaluatorId } from "../services/evaluator-client";
import { ICodeCellViewModel } from "./code-cell";
import { ICommander, ICommanderId } from "../services/commander";
import { IUndoRedo, IUndoRedoId } from "../services/undoredo";
import { IHotkeysOverlayViewModel } from "../components/hotkeys-overlay";
import { IRecentFiles, IRecentFiles_ID } from "../services/recent-files";
import { IZoom, IZoomId } from "../services/zoom";
import { ICellViewModel } from "./cell";
import { CellOutputViewModel } from "./cell-output";
import { CellErrorViewModel } from "./cell-error";
import { action, computed, observable } from "mobx";

type OpenNotebookChangedEventHandler = (isReload: boolean) => Promise<void>;

//
// Registers the choice the makers to save, don't save or cancel when closing a notebook that is modified but not saved.
//
export enum SaveChoice {
    Save = "Save",
    DontSave = "Don't save",
    Cancel = "Cancel",
}

//
// View-mmodel for the app.
//
export interface INotebookEditorViewModel extends IHotkeysOverlayViewModel {

    //
    // The currently open notebook.
    //
    notebook: INotebookViewModel | undefined;

    //
    // When greater than 0 the app is busy wth a global task.
    //
    working: number;

    //
    // Cell currently in the clipboard to be pasted.
    //
    cellClipboard: ISerializedCell1 | undefined;

    //
    // Mounts the UI.
    //
    mount(): void;

    // 
    // Unmounts the UI.
    //
    unmount(): void;

    //
    // Returns true when the app has a global task in progress.
    //
    get isWorking(): boolean;

    //
    // Start a global task.
    //
    startBlockingTask(): Promise<void>;

    //
    // End a global task.
    //
    endBlockingTask(): Promise<void>;

    //
    // Event raised when the app has started or stopped a task.
    //
    isWorkingChanged: IEventSource<BasicEventHandler>;

    //
    // Sets a new notebook and rebind/raise appropriate events.
    //
    setNotebook(notebook: INotebookViewModel, isReload: boolean): Promise<void>;

    //
    // Prompt the user as to whether they should save their notebook.
    //
    promptSave(title: string): Promise<boolean>;

    //
    // Create a new notebook.
    // Returns null if we couldn't create a new notebook.
    //
    newNotebook(language: string): Promise<INotebookViewModel | undefined>;

    //
    // Open a notebook from a user-selected file.
    //
    openNotebook(directoryPath?: string): Promise<INotebookViewModel | undefined>;

    //
    // Open a notebook from a specific location.
    //
    openSpecificNotebook(storageId: INotebookStorageId): Promise<INotebookViewModel | undefined>;

    //
    // Save the currently open notebook to it's previous file name.
    //
    saveNotebook(): Promise<void>;

    //
    // Save the notebook as a new file.
    //
    saveNotebookAs(): Promise<void>;

    //
    // Reloads the current notebook.
    //
    reloadNotebook(): Promise<void>;

    //
    // Evaluates the current notebook.
    //
    evaluateNotebook(): Promise<void>;
    
    //
    // Evaluate up to the particular cell.
    //
    evaluateToCell(cell?: ICellViewModel): Promise<void>;

    //
    // Evaluate the single cell.
    //
    evaluateSingleCell(cell: ICellViewModel): Promise<void>;

    //
    // Notify the app that a notebook was modified.
    //
    notifyModified(): Promise<void>;

    //
    // Event raised when the content of the notebook has been modified.
    //
    onModified: IEventSource<BasicEventHandler>;

    //
    // Notify that the editor is ready for use.
    //
    notifyEditorReady(): Promise<void>;

    //
    // Event raised when the notebook editor is ready for use.
    //
    onEditorReady: IEventSource<BasicEventHandler>;

    //
    // Event raised when the open notebook is about to change.
    //
    onOpenNotebookWillChange: IEventSource<BasicEventHandler>;
    
    //
    // Event raised when the open notebook have changed.
    //
    onOpenNotebookChanged: IEventSource<OpenNotebookChangedEventHandler>;

    //
    // Event raised when the set notebook has been rendered.
    //
    onNotebookRendered: IEventSource<BasicEventHandler>;

    //
    // Opens or closes the command palette.
    //
    toggleCommandPalette(): Promise<void>;

    //
    // Event raised to toggle the command palette.
    //
    onToggleCommandPalette: IEventSource<BasicEventHandler>;

    //
    // Opens or closes the recent file picker.
    //
    toggleRecentFilePicker(): Promise<void>;

    //
    // Event raised to toggle the recent file picker.
    //
    onToggleRecentFilePicker: IEventSource<BasicEventHandler>;

    //
    // Opens or closes the example notebook browser.
    //
    toggleExamplesBrowser(): Promise<void>;

    //
    // Event raised to toggle the example notebook browser.
    //
    onToggleExamplesBrowser: IEventSource<BasicEventHandler>;
}

@InjectableClass()
export class NotebookEditorViewModel implements INotebookEditorViewModel {

    @InjectProperty(IIdGeneratorId)
    idGenerator!: IIdGenerator;

    @InjectProperty(ILogId)
    log!: ILog;

    @InjectProperty(INotificationId)
    notification!: INotification;

    @InjectProperty(INotebookRepositoryId)
    notebookRepository!: INotebookRepository;

    @InjectProperty(IConfirmationDialogId)
    confirmationDialog!: IConfirmationDialog;

    @InjectProperty(IEvaluatorId)
    evaluator!: IEvaluatorClient;

    @InjectProperty(ICommanderId)
    commander!: ICommander;

    @InjectProperty(IUndoRedoId)
    undoRedo!: IUndoRedo;

    @InjectProperty(IRecentFiles_ID)
    recentFiles!: IRecentFiles;

    @InjectProperty(IZoomId)
    zoom!: IZoom;

    //
    // The currently open notebook.
    //
    @observable
    notebook: INotebookViewModel | undefined = undefined;

    //
    // When greater than 0 the app is busy wth a global task.
    //
    @observable
    working: number = 0;

    //
    // Set to true when the hotkeys overlay is open.
    //
    @observable
    showHotkeysOverlay: boolean = false;

    //
    // Cell currently in the clipboard to be pasted.
    //
    @observable
    cellClipboard: ISerializedCell1 | undefined;

    constructor(notebook?: INotebookViewModel) { 
        if (notebook) {
            this.notebook = notebook;
            this.notebook.onModified.attach(this.notifyModified);
        }
    }

    //
    // Mounts the UI.
    //
    mount(): void {
        this.evaluator.onEvaluationEvent.attach(this.onEvaluatorEvent);

        //
        // Allows commands to be run against this notebook editor.
        //
        this.commander.setNotebookEditor(this);

        if (this.notebook) {
            this.undoRedo.clearStack(this.notebook!);
        }

        this.zoom.init();
    }

    // 
    // Unmounts the UI.
    //
    unmount(): void {
        this.evaluator.onEvaluationEvent.detach(this.onEvaluatorEvent);

        this.zoom.deinit();
    }

    //
    // Returns true when the app has a global task in progress.
    //
    @computed
    get isWorking(): boolean {
        return this.working > 0;
    }

    //
    // Start a global task.
    //
    @action
    async startBlockingTask(): Promise<void> {
        const isFirstTask = this.working <= 0;
        ++this.working;
        if (isFirstTask) {
            await this.isWorkingChanged.raise();
        }
    }

    //
    // End a global task.
    //
    @action
    async endBlockingTask(): Promise<void> {
        --this.working;
        if (this.working <= 0) {
            await this.isWorkingChanged.raise();
        }
    }
    
    //
    // Event raised when the app has started or stopped a task.
    //
    isWorkingChanged: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
    
    //
    // Sets a new notebook and rebind/raise appropriate events.
    //
    @action
    async setNotebook(notebook: INotebookViewModel, isReload: boolean): Promise<void> {

        await this.onOpenNotebookWillChange.raise();

        if (this.notebook) {
            this.notebook.onModified.detach(this.notifyModified);

            //
            // Stop evaluation of whatever  notebook is being unloaded.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
        }
        
        this.notebook = notebook;
        this.notebook.onModified.attach(this.notifyModified);

        this.evaluator.installNotebook(notebook.instanceId, notebook.serializeForEval(), notebook.storageId.getContainingPath());

        await this.notifyOpenNotebookChanged(isReload);

        await this.onNotebookRendered.raise();
    }

    //
    // Prompt the user as to whether they should save their notebook.
    //
    async promptSave(title: string): Promise<boolean> {
        if (!this.notebook) {
            return true; // Notebook notebook loaded yet, allow operation to procede.
        }

        if (!this.notebook.modified) {
            return true; // Notebook not modified, allow operation to procede.
        }

        const choice = await this.confirmationDialog.show({
            title: title,
            options: [SaveChoice.Save, SaveChoice.DontSave, SaveChoice.Cancel],
            msg: 
                "Do you want to save changes that you made to " + this.notebook.storageId.displayName() +
                "\r\nIf you don't save your changes will be lost.",
        }) as SaveChoice;

        if (choice === SaveChoice.Save) {
            // Save current notebook.
            await this.saveNotebook();
        }
        else if (choice == SaveChoice.Cancel) {
            return false; // Abort.
        }

        return true; // Allow operation to procede.
    }
    
    //
    // Create a template for a new notebok.
    //
    newNotebookTemplate(language: string): ISerializedNotebook1 {
        const template: ISerializedNotebook1 = {
            "version": notebookVersion,
            "language": language,
            "cells": [
                {
                    "id": this.idGenerator.genId(),
                    "cellType": CellType.Code,
                    "code": "",
                    "output": [],
                    "errors": []
                }
            ]
        };
        return template;
    }

    //
    // Create a new notebook.
    //
    @action
    async newNotebook(language: string): Promise<INotebookViewModel | undefined> { 

        if (this.isWorking) {
            this.notification.warn("Already working!");
            return undefined;
        }

        this.log.info(`Creating new notebook for language ${language}.`);

        if (await this.promptSave("New notebook")) {
			await this.startBlockingTask();
        	
            try {
                const newNotebookId = this.notebookRepository.makeUntitledNotebookId();
                const notebookTemplate = this.newNotebookTemplate(language);
                const notebook = NotebookViewModel.deserialize(newNotebookId, true, false, notebookTemplate);
                await this.setNotebook(notebook, false);
                this.notebook!.cells[0].select();
                return this.notebook!;
            }
            finally {
                await this.endBlockingTask();
            }
        }
        else {
            return undefined;
        }
    }

    //
    // Open a notebook from a user-selected file.
    //
    @action
    async openNotebook(directoryPath?: string): Promise<INotebookViewModel | undefined> {
        if (this.isWorking) {
            this.notification.warn("Already working!");
            return undefined;
        }

        if (!await this.promptSave("Open notebook")) {
            // User has an unsaved notebook that they want to save.
            return undefined;
        }

        const notebookId = await this.notebookRepository.showNotebookOpenDialog(directoryPath);
        if (!notebookId) {
            return undefined;
        }

        return await this.internalOpenNotebook(notebookId, false);
    }

    //
    // Open a notebook from a specific location.
    //
    @action
    async openSpecificNotebook(notebookId: INotebookStorageId): Promise<INotebookViewModel | undefined> {

        if (this.isWorking) {
            this.notification.warn("Already working!");
            return undefined;
        }

        if (!await this.promptSave("Open notebook")) {
            // User has an unsaved notebook that they want to save.
            return undefined;
        }

        const notebook = await this.internalOpenNotebook(notebookId, false);
        return notebook;
    }

    //
    // Open a notebook from a specific file.
    //
    @action
    async internalOpenNotebook(notebookId: INotebookStorageId, isReload: boolean): Promise<INotebookViewModel | undefined> {

		await this.startBlockingTask();

		this.log.info("Opening notebook: " + notebookId.displayName());

        try {
			const { data, readOnly } = await this.notebookRepository.readNotebook(notebookId);
			const notebook = NotebookViewModel.deserialize(notebookId, false, readOnly, data);
			await this.setNotebook(notebook, isReload);
            const filePath = notebookId.toString();
            if (filePath) {
                this.recentFiles.addRecentFile(filePath);
            }

			this.log.info("Opened notebook: " + notebookId.displayName());

            return this.notebook!;
        }
        catch (err) {
            this.log.error("Error opening notebook: " + notebookId.displayName());
            this.log.error(err & err.stack || err);
            const msg = "Failed to open notebook: " + path.basename(notebookId.displayName())
                + "\r\nError: " + (err && (err.message || err.stack || err.toString()) || "unknown");
            this.notification.error(msg);
            return undefined;
        }
        finally {
            await this.endBlockingTask();
        }
    }

    //
    // Save the currently open notebook to it's previous file name.
    //
    @action
    async saveNotebook(): Promise<void> {
        if (this.isWorking) {
            this.notification.warn("Already working!");
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (this.notebook.unsaved || this.notebook.readOnly) {
            await this.saveNotebookAs();
        }
        else {
            await this.notebook.save();
        }
    }

    //
    // Save the notebook as a new file.
    //
    @action
    async saveNotebookAs(): Promise<void> {
        if (this.isWorking) {
            this.notification.warn("Already working!");
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        const newStorageId = await this.notebookRepository.showNotebookSaveAsDialog(this.notebook.storageId)
        if (!newStorageId) {
            // User cancelled.
            return;
        }

        await this.onOpenNotebookWillChange.raise();

        await this.notebook.saveAs(newStorageId);
        this.recentFiles.addRecentFile(newStorageId.toString()!);

        await this.notifyOpenNotebookChanged(false);
    }

    //
    // Reloads the current notebook.
    //
    @action
    async reloadNotebook(): Promise<void> {
        if (this.isWorking) {
            this.notification.warn("Already working!");
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (!await this.promptSave("Reload notebook")) {
            // User has an unsaved notebook that they want to save.
            return;
        }

        await this.internalOpenNotebook(this.notebook.storageId, true);
    }

    //
    // Checks if the current notebook can be evaluated.
    //
    async checkCanEvaluateNotebook(): Promise<boolean> {
        if (this.isWorking) {
            this.notification.warn("Already working!");
            return false;
        }

        if (!this.notebook) {
            this.notification.warn("You must create or open a notebook before evaluating it.");
            return false;
        }

        if (this.notebook.readOnly) {
            this.notification.error("The file for this notebook is readonly, please save it to a different location and copy any data files that it uses. Then you can run it.");
            return false;
        }

        return true;
    }

    //
    // Evaluates the current notebook.
    //
    @action
    async evaluateNotebook(): Promise<void> {

        if (!await this.checkCanEvaluateNotebook()) {
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (this.notebook.executing) {
            //
            // Trying to start an evaluation while one is already in progress will stop it.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
            await this.onEvaluationFinished();
            return;
        }

        await this.notebook.flushChanges();

        this.evaluator.evalNotebook(this.notebook.instanceId, this.notebook.serializeForEval(), this.notebook.storageId.getContainingPath());

        await this.onEvaluationStarted();
    }

    //
    // Evaluate up to the particular cell.
    //
    @action
    async evaluateToCell(cell: ICellViewModel): Promise<void> {
        
        if (!await this.checkCanEvaluateNotebook()) {
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }
        
        if (this.notebook.executing) {
            //
            // Trying to start an evaluation while one is already in progress will stop it.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
            await this.onEvaluationFinished();
            return;
        }

        await this.notebook.flushChanges();

        this.evaluator.evalToCell(this.notebook.instanceId, this.notebook.serializeForEval(), cell.id, this.notebook.storageId.getContainingPath());

        await this.onEvaluationStarted();
    }

    //
    // Evaluate the single cell.
    //
    @action
    async evaluateSingleCell(cell: ICellViewModel): Promise<void> {
        
        if (!await this.checkCanEvaluateNotebook()) {
            return;
        }

        if (!this.notebook) {
            this.notification.warn("No notebook open!");
            return;
        }

        if (this.notebook.executing) {
            //
            // Trying to start an evaluation while one is already in progress will stop it.
            //
            this.evaluator.stopEvaluation(this.notebook.instanceId);
            await this.onEvaluationFinished();
            return;
        }

        
        await this.notebook.flushChanges();

        if (cell.cellType !== CellType.Code) {
            this.notification.warn("Requested cell is not a code cell.");
            return;
        }

        this.evaluator.evalSingleCell(this.notebook.instanceId, this.notebook.serializeForEval(), cell.id, this.notebook.storageId.getContainingPath());

        await this.onEvaluationStarted();
    }

    //
    // Event handlers for the evaluation engine.
    //
    evaluatorEventHandlers: { [index: string]: (args: any) => Promise<void> } = {

        "notebook-install-started": async (args: any): Promise<void> => {
            // Nothing yet.
        },

        "notebook-install-completed": async (args: any): Promise<void> => {
            // Nothing yet.
        },

        "notebook-eval-started": async (args: any): Promise<void> => {
            // Nothing yet.
        },

        "cell-eval-started": async (args: any): Promise<void> => {
            const cell = this.notebook!.findCell(args.cellId);
            if (cell) {
                await cell.notifyCodeEvalStarted();
            }
            else {
                this.log.error("cell-eval-started: Failed to find cell " + args.cellId);
            }
        },

        "cell-eval-completed": async (args: any): Promise<void> => {
            const cell = this.notebook!.findCell(args.cellId);
            if (cell) {
                await cell.notifyCodeEvalComplete();
            }
            else {
                this.log.error("cell-eval-completed: Failed to find cell " + args.cellId);
            }
        },

        "notebook-eval-completed": async (args: any): Promise<void> => {
            await this.onEvaluationFinished();
        },

        "output-capped": async () => {
            this.notification.warn("Output and errors from code have been capped to 1000 items, perhaps you have an infinite loop in your code?");
        },

        "receive-display": async (args: any): Promise<void> => {
            for (const cellOutput of args.outputs) {
                const cell = this.notebook!.findCell(cellOutput.cellId) as ICodeCellViewModel;
                if (cell) {
                    cell.addOutput(CellOutputViewModel.deserialize({ value:  cellOutput.output }));
                }
                else {
                    this.log.error("receive-display: Failed to find cell " + cellOutput.cellId);
                }
            }
        },

        "receive-error": async (args: any): Promise<void> => {
            this.reportError(args.cellId, args.error);
        },
    };

    //
    // Report an error to a particular cell.
    //
    @action
    reportError(cellId: string | undefined, error: string) {
        const cell = cellId && this.notebook!.findCell(cellId) as ICodeCellViewModel;
        if (cell) {
            cell.addError(new CellErrorViewModel(error));
        }
        else {
            //
            // Just add the error to the first code cell.
            //
            for (const cell of this.notebook!.cells) {
                if (cell.cellType === CellType.Code) {
                    (cell as ICodeCellViewModel).addError(new CellErrorViewModel(error));
                    return;
                }
            }

            this.log.error("receive-error: Failed to find cell " + cellId + ", error = " + error);
        }
    }

    //
    // Event raised when an event is recieved from the evaluator.
    //
    onEvaluatorEvent = async (args: any): Promise<void> => {
        const event = args.event as string;
        const eventHandler = this.evaluatorEventHandlers[event];
        if (eventHandler) {
            await eventHandler(args);
        }
        else {
            this.log.error(`Not handling evaluation event ${event}.`);
        }
    }

    //
    // Notification that evaluation has started.
    //
    @action
    async onEvaluationStarted(): Promise<void> {
        await this.notebook!.notifyCodeEvalStarted();
    }

    //
    // Notification that evaluation has completed.
    //
    @action
    async onEvaluationFinished(): Promise<void> {
        await this.notebook!.notifyCodeEvalComplete();
    }

    //
    // Notify the app that a notebook was modified.
    //
    notifyModified = async (): Promise<void> => {
        await this.onModified.raise();
    }

    //
    // Event raised when the content of the notebook has been modified.
    //
    onModified: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Notify that the editor is ready for use.
    //
    async notifyEditorReady(): Promise<void> {
        await this.onEditorReady.raise();
    }

    //
    // Event raised when the notebook editor is ready for use.
    //
    onEditorReady: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Event raised when the open notebook is about to change.
    //
    onOpenNotebookWillChange: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Called when the currently open notebook has changed.
    //
    @action
    async notifyOpenNotebookChanged(isReload: boolean): Promise<void> {
        await this.onOpenNotebookChanged.raise(isReload);

        this.undoRedo.clearStack(this.notebook!);
    }
    
    //
    // Event raised when the open notebook have changed.
    //
    onOpenNotebookChanged: IEventSource<OpenNotebookChangedEventHandler> = new EventSource<OpenNotebookChangedEventHandler>();

    //
    // Event raised when the set notebook has been rendered.
    //
    onNotebookRendered: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Toggle the hotkeys overlay.
    //
    @action
    async toggleHotkeysOverlay(): Promise<void> {
        this.showHotkeysOverlay = !this.showHotkeysOverlay;
    }

    //
    // Opens or closes the command palette.
    //
    async toggleCommandPalette(): Promise<void> {
        await this.onToggleCommandPalette.raise();
    }

    //
    // Event raised to toggle the command palette.
    //
    onToggleCommandPalette: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Opens or closes the recent file picker.
    //
    async toggleRecentFilePicker(): Promise<void> {
        await this.onToggleRecentFilePicker.raise();
    }

    //
    // Event raised to toggle the recent file picker.
    //
    onToggleRecentFilePicker: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();

    //
    // Opens or closes the example notebook browser.
    //
    async toggleExamplesBrowser(): Promise<void> {
        await this.onToggleExamplesBrowser.raise();
    }

    //
    // Event raised to toggle the example notebook browser.
    //
    onToggleExamplesBrowser: IEventSource<BasicEventHandler> = new EventSource<BasicEventHandler>();
}
