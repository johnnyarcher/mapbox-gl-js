// @flow

import StyleLayer from '../style_layer';
import {CustomLayerSpecification} from '../custom_layer_spec';

class CustomStyleLayer extends StyleLayer {

    implementation: CustomLayerSpecification;

    constructor(implementation: CustomLayerSpecification) {
        super(implementation, {});
        this.implementation = implementation;
    }

    hasTransition() {
        return this.implementation.hasTransition !== undefined ?
            this.implementation.hasTransition() :
            false;
    }

    hasOffscreenPass() {
        return this.implementation.render3D !== undefined;
    }

    recalculate() {}
    updateTransitions() {};

    serialize() {
        throw "Custom layers cannot be serialized";
    }

    resize() {
        console.log('destroy');
        if (this.viewportFrame) {
            this.viewportFrame.destroy();
            this.viewportFrame = null;
        }
    }
}

export default CustomStyleLayer;
