import { Common } from 'matter-js';
import * as Matter from 'matter-js';

/**
 * An attractors plugin for matter.js.
 * See the readme for usage and examples.
 * @module MatterAttractors
 */
export const MatterAttractors = {
    // plugin meta
    name: 'matter-attractors', // PLUGIN_NAME
    version: '0.1.6', // PLUGIN_VERSION
    for: 'matter-js@^0.12.0',

    // installs the plugin where `base` is `Matter`
    // you should not need to call this directly.
    install: function (): void {
        Common.chainPathAfter(Matter, 'Body.create', function () {
            MatterAttractors.Body.init(this);
        });

        Common.chainPathBefore(Matter, 'Engine.update', function (engine) {
            MatterAttractors.Engine.update(engine);
        });
    },

    Body: {
        /**
         * Initialises the `body` to support attractors.
         * This is called automatically by the plugin.
         * @function MatterAttractors.Body.init
         * @param {Matter.Body} body The body to init.
         * @returns {void} No return value.
         */
        init: function (body) {
            body.plugin.attractors = body.plugin.attractors || [];
        }
    },

    Engine: {
        /**
         * Applies all attractors for all bodies in the `engine`.
         * This is called automatically by the plugin.
         * @function MatterAttractors.Engine.update
         * @param {Matter.Engine} engine The engine to update.
         * @returns {void} No return value.
         */
        update: function (engine) {
            let world = engine.world,
                bodies = Matter.Composite.allBodies(world);

            for (let i = 0; i < bodies.length; i += 1) {
                let bodyA = bodies[i],
                    attractors = bodyA.plugin.attractors;

                if (attractors && attractors.length > 0) {
                    for (let j = 0; j < bodies.length; j += 1) {
                        if (j === i) continue;

                        let bodyB = bodies[j];

                        for (let k = 0; k < attractors.length; k += 1) {
                            let attractor = attractors[k],
                                forceVector = attractor;

                            if (Matter.Common.isFunction(attractor)) {
                                forceVector = attractor(bodyA, bodyB);
                            }

                            if (forceVector) {
                                Matter.Body.applyForce(
                                    bodyB,
                                    bodyB.position,
                                    forceVector
                                );
                            }
                        }
                    }
                }
            }
        }
    },

    /**
     * Defines some useful common attractor functions that can be used
     * by pushing them to your body's `body.plugin.attractors` array.
     * @namespace MatterAttractors.Attractors
     * @property {number} gravityConstant The gravitational constant used by the gravity attractor.
     */
    Attractors: {
        gravityConstant: 0.001,

        /**
         * An attractor function that applies Newton's law of gravitation.
         * Use this by pushing `MatterAttractors.Attractors.gravity` to your body's `body.plugin.attractors` array.
         * The gravitational constant defaults to `0.001` which you can change
         * at `MatterAttractors.Attractors.gravityConstant`.
         * @function MatterAttractors.Attractors.gravity
         * @param {Matter.Body} bodyA The first body.
         * @param {Matter.Body} bodyB The second body.
         * @returns {void} No return value.
         */
        gravity: function (bodyA, bodyB) {
            // use Newton's law of gravitation
            var bToA = Matter.Vector.sub(bodyB.position, bodyA.position),
                distanceSq = Matter.Vector.magnitudeSquared(bToA) || 0.0001,
                normal = Matter.Vector.normalise(bToA),
                magnitude =
                    -MatterAttractors.Attractors.gravityConstant *
                    ((bodyA.mass * bodyB.mass) / distanceSq),
                force = Matter.Vector.mult(normal, magnitude);

            // to apply forces to both bodies
            Matter.Body.applyForce(
                bodyA,
                bodyA.position,
                Matter.Vector.neg(force)
            );
            Matter.Body.applyForce(bodyB, bodyB.position, force);
        }
    }
};
