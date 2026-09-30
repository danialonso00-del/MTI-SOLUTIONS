import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { RoadAgent } from '../src/three/realtraffic.js';
import { buildRoadNetwork } from '../src/three/realcity.js';
import { lightAtHour } from '../src/three/atmosphere.js';

const network = () => buildRoadNetwork([{ k: 'primary', w: 10, p: [[0, 0], [20, 0], [20, 20], [40, 20]] }]);
function agent(net = network()) {
  const a = new RoadAgent(net, 12, 2.7);
  a.pick(0, 0);
  a.rawPosition(a.visual);
  a.heading = a.targetHeading;
  return a;
}

test('vehicles cross junctions without position or heading snaps', () => {
  const a = agent();
  const position = new THREE.Vector3();
  for (let i = 0; i < 600; i++) {
    a.position(position);
    const heading = a.heading;
    a.step(1 / 60);
    assert.ok(a.visual.distanceTo(position) < 1, 'movement stays continuous through corners and U-turns');
    assert.ok(Math.abs(a.heading - heading) < 0.37, 'heading follows the shortest arc');
  }
});

test('junctions preserve overshoot and total distance at different frame rates', () => {
  const a = agent();
  a.t = 19.9;
  a.step(0.1);
  assert.ok(Math.abs(a.t - 1.1) < 1e-8);
  for (const hz of [30, 60, 120]) {
    const b = agent();
    for (let i = 0; i < hz * 3; i++) b.step(1 / hz);
    assert.equal(b.index, 1);
    assert.ok(Math.abs(b.t - 16) < 1e-7);
  }
});

test('paused agents retain their position and heading', () => {
  const a = agent();
  a.step(0.1);
  const before = [a.t, ...a.visual.toArray(), a.heading];
  a.step(0);
  assert.deepEqual([a.t, ...a.visual.toArray(), a.heading], before);
});

test('daylight is continuous at midnight and includes twilight', () => {
  assert.equal(lightAtHour(13).night, 0);
  assert.equal(lightAtHour(0).night, 1);
  assert.equal(lightAtHour(0).night, lightAtHour(24).night);
  assert.ok(lightAtHour(20).night > 0 && lightAtHour(20).night < 1);
  for (let h = 0.05; h < 24; h += 0.05) assert.ok(Math.abs(lightAtHour(h).night - lightAtHour(h - 0.05).night) < 0.05);
});
