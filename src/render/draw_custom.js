// @flow

export default drawCustom;

import { mat3, mat4, vec3 } from 'gl-matrix';

import Texture from './texture';
import Color from '../style-spec/util/color';
import StencilMode from '../gl/stencil_mode';
import DepthMode from '../gl/depth_mode';

import type Painter from './painter';
import type SourceCache from '../source/source_cache';
import type CustomStyleLayer from '../style/style_layer/custom_style_layer';

function drawCustom(painter: Painter, sourceCache: SourceCache, layer: CustomStyleLayer) {

    const context = painter.context;
    const gl = context.gl;

    if (painter.renderPass === 'translucent') {
        if (layer.implementation.render) {
            context.setStencilMode(StencilMode.disabled);
            context.setDepthMode(DepthMode.disabled);
            layer.implementation.render(painter.context.gl, painter.transform.customLayerMatrix());
            context.restore();
        }
        if (layer.implementation.render3D) {
            drawExtrusionTexture(painter, layer);
        }

    } else if (painter.renderPass === 'offscreen' && layer.implementation.render3D) {

        const context = painter.context;
        const gl = context.gl;

        let renderTarget = layer.viewportFrame;

        if (painter.depthRboNeedsClear) {
            painter.setupOffscreenDepthRenderbuffer();
        }

        if (!renderTarget) {
            const texture = new Texture(context, {width: painter.width, height: painter.height, data: null}, gl.RGBA);
            texture.bind(gl.LINEAR, gl.CLAMP_TO_EDGE);

            renderTarget = layer.viewportFrame = context.createFramebuffer(painter.width, painter.height);
            renderTarget.colorAttachment.set(texture.texture);
        }

        context.bindFramebuffer.set(renderTarget.framebuffer);
        renderTarget.depthAttachment.set(painter.depthRbo);

        if (painter.depthRboNeedsClear) {
            context.clear({ depth: 1 });
            painter.depthRboNeedsClear = false;
        }

        context.clear({ color: Color.transparent });

        context.setStencilMode(StencilMode.disabled);
        context.setDepthMode(new DepthMode(gl.LEQUAL, DepthMode.ReadWrite, [0, 1]));
        context.setColorMode(painter.colorModeForRenderPass());

        layer.implementation.render3D(painter.context.gl, painter.transform.customLayerMatrix(layer.implementation.translate, layer.implementation.scale));


        context.restore();
    }
}

function drawExtrusionTexture(painter, layer) {
    const renderedTexture = layer.viewportFrame;
    if (!renderedTexture) return;

    const context = painter.context;
    const gl = context.gl;
    const program = painter.useProgram('extrusionTexture');

    context.setStencilMode(StencilMode.disabled);
    context.setDepthMode(DepthMode.disabled);
    context.setColorMode(painter.colorModeForRenderPass());

    context.activeTexture.set(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, renderedTexture.colorAttachment.get());

    gl.uniform1f(program.uniforms.u_opacity, 1);//layer.paint.get('fill-extrusion-opacity'));
    gl.uniform1i(program.uniforms.u_image, 0);

    const matrix = mat4.create();
    mat4.ortho(matrix, 0, painter.width, painter.height, 0, 0, 1);
    gl.uniformMatrix4fv(program.uniforms.u_matrix, false, matrix);

    gl.uniform2f(program.uniforms.u_world, gl.drawingBufferWidth, gl.drawingBufferHeight);

    painter.viewportVAO.bind(context, program, painter.viewportBuffer, []);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

