# Coco Scene Interpreter

Production-oriented TypeScript scene interpretation for Nightlife Flyers.

Pipeline:

Detector/image signals → normalized evidence → story/hero/visual weight → creative decisions → constraints/opportunities → downstream authority.

This package is model-agnostic. Face, gaze, hand, drink, and segmentation accuracy depend on the upstream vision model. The interpreter converts those signals into design decisions.
