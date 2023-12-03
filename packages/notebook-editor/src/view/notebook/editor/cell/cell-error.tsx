//
// Displays an error from a code cell.
//

import { observer } from 'mobx-react';
import * as React from 'react';
import { ICellErrorViewModel } from '../../../../view-model/cell-error';

export interface ICellErrorProps {
    
    //
    // The view model for the error.
    //
    error: ICellErrorViewModel;
}

@observer
export class CellErrorUI extends React.Component<ICellErrorProps, {}> {

    render () {
        return (
            <div className="error-border">
                <pre>
                    {this.props.error.msg}
                </pre>
            </div>
        );
    }
}

