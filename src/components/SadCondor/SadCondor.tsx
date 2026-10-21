"use client";

import { useEffect, useRef } from "react";

const WIDTH = 320;
const HEIGHT = 260;
const GROUND = 236;

const FEATHER = "#1b1b1b";
const FEATHER_EDGE = "#3a3a3a";
const UNDERWING = "#f2f2f2";
const HEAD = "#e8836b";
const LID = "#c96a54";
const NECK = "#d6a094";
const BEAK = "#efe6d2";
const LEG = "#a0938d";
const TEAR = "#7fb8e0";

type Ctx = CanvasRenderingContext2D;

function drawLegs(ctx: Ctx) {
  ctx.lineCap = "round";
  for (const [hipX, kneeX, footX] of [
    [138, 144, 140],
    [154, 160, 156],
  ]) {
    ctx.strokeStyle = LEG;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(kneeX, 206);
    ctx.lineTo(footX, GROUND);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(footX, GROUND);
    ctx.lineTo(footX + 18, GROUND);
    ctx.moveTo(footX, GROUND);
    ctx.lineTo(footX + 14, GROUND - 2);
    ctx.moveTo(footX, GROUND);
    ctx.lineTo(footX - 7, GROUND);
    ctx.stroke();

    // Feathered thigh
    ctx.strokeStyle = FEATHER;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.moveTo(hipX, 178);
    ctx.lineTo(kneeX, 206);
    ctx.stroke();
  }
}

function drawBody(ctx: Ctx) {
  // Tail drooping to the ground
  ctx.fillStyle = FEATHER;
  ctx.beginPath();
  ctx.moveTo(112, 158);
  ctx.lineTo(62, 220);
  ctx.lineTo(82, 226);
  ctx.lineTo(128, 180);
  ctx.closePath();
  ctx.fill();

  ctx.beginPath();
  ctx.ellipse(152, 152, 54, 35, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Folded wing hanging limp over the body, primaries trailing past the tail
  ctx.strokeStyle = FEATHER_EDGE;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(186, 126);
  ctx.quadraticCurveTo(140, 112, 92, 196);
  ctx.quadraticCurveTo(140, 186, 182, 152);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  for (let i = 0; i < 4; i++) {
    ctx.save();
    ctx.translate(96 - i * 3, 194 + i * 2);
    ctx.rotate(0.7 + i * 0.12);
    ctx.beginPath();
    ctx.ellipse(0, 10, 2.6, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // White underwing bar showing along the bottom of the fold
  ctx.strokeStyle = UNDERWING;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(172, 156);
  ctx.quadraticCurveTo(140, 178, 112, 186);
  ctx.stroke();
}

function drawHead(ctx: Ctx) {
  // Neck sagging forward so the head hangs below the shoulders
  ctx.strokeStyle = NECK;
  ctx.lineWidth = 9;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(194, 130);
  ctx.quadraticCurveTo(224, 128, 226, 166);
  ctx.stroke();

  // Ruff of black feathers around the base of the neck
  ctx.fillStyle = FEATHER;
  ctx.beginPath();
  for (let i = 0; i <= 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const r = i % 2 === 0 ? 18 : 12;
    ctx.lineTo(192 + Math.cos(a) * r, 128 + Math.sin(a) * r * 0.75);
  }
  ctx.fill();

  ctx.save();
  ctx.translate(228, 176);
  ctx.rotate(1.1);

  ctx.fillStyle = HEAD;
  ctx.beginPath();
  ctx.ellipse(0, 0, 13, 10, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = BEAK;
  ctx.beginPath();
  ctx.moveTo(9, -5);
  ctx.quadraticCurveTo(23, -5, 22, 5);
  ctx.quadraticCurveTo(18, 2, 10, 4);
  ctx.closePath();
  ctx.fill();

  // Eye half-covered by a heavy lid, brow raised at the inner corner
  ctx.fillStyle = "#2a0f0f";
  ctx.beginPath();
  ctx.arc(2, -3, 2.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = LID;
  ctx.beginPath();
  ctx.arc(2, -3, 3.4, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.strokeStyle = "#5a2418";
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-4, -6);
  ctx.lineTo(7, -10);
  ctx.stroke();
  ctx.restore();

  // A single tear running down from the eye
  ctx.fillStyle = TEAR;
  ctx.beginPath();
  ctx.moveTo(229, 184);
  ctx.quadraticCurveTo(234, 192, 229, 195);
  ctx.quadraticCurveTo(224, 192, 229, 184);
  ctx.fill();
}

function draw(ctx: Ctx) {
  ctx.fillStyle = "rgba(0, 0, 0, 0.12)";
  ctx.beginPath();
  ctx.ellipse(158, GROUND + 3, 72, 6, 0, 0, Math.PI * 2);
  ctx.fill();

  drawLegs(ctx);
  drawBody(ctx);
  drawHead(ctx);
}

/** A slumped, teary California condor drawn on a canvas. */
export default function SadCondor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    ctx.scale(dpr, dpr);
    draw(ctx);
  }, []);

  return (
    <canvas
      ref={canvasRef}
      role="img"
      aria-label="A sad condor with its head hanging down"
      style={{ display: "block", width: "100%", maxWidth: WIDTH, aspectRatio: `${WIDTH} / ${HEIGHT}`, margin: "0 auto" }}
    />
  );
}
