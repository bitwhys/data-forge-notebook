//
// Renders the cell drag handle.
//

import * as React from 'react';
import { DraggableProvidedDragHandleProps } from 'react-beautiful-dnd';
import { CellUI } from './cell';
import { ICellViewModel } from '../../../../view-model/cell';
const classnames = require("classnames");

export interface ICellHandleProps {

    //
    // The parent cell.
    //
    cell: CellUI;

    //
    // The model for the cell.
    //
    model: ICellViewModel;
    
    //
    // The HTML element that contains the cell.
    //
    cellContainerElement: React.RefObject<HTMLDivElement>;

    //
    // Is the drag handle selected?
    //
    isSelected: boolean;

    //
    //  Properties for the drag handle.
    //
    dragHandleProps: DraggableProvidedDragHandleProps | undefined;
}

export interface ICellHandleState {
}

export class CellHandle extends React.Component<ICellHandleProps, ICellHandleState> {

    constructor(props: ICellHandleProps) {
        super(props);

        this.state = {
            height: 0,
        };
    }

    render() {
        return (
            <>
                <div 
                    className={classnames(
                        "selected-cell-handle", 
                        "inline-block",
                        "align-top",
                        this.props.model.getCellType(),
                        { 
                            focused: this.props.isSelected
                        }
                    )}
                    style={{
                        width: "8px",
                        height: "100%",
                    }}
                    {...this.props.dragHandleProps} 
                    />
            </>
        );
    }
}
