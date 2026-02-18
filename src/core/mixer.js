import * as Tone from "tone";

export async function createMixer() {
  // Master bus: volume → compressor → destination
  const master = new Tone.Volume(0);
  const compressor = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.003,
    release: 0.25,
  });
  master.chain(compressor, Tone.getDestination());

  // FX return buses using Channel send/receive pattern
  const reverb = new Tone.Reverb({ decay: 2.5, wet: 1 });
  const reverbChannel = new Tone.Channel({ volume: -6 }).connect(master);
  reverb.connect(reverbChannel);
  const reverbReceive = new Tone.Channel({ volume: 0 }).connect(reverb);
  reverbReceive.receive("reverb");

  const delay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.35,
    wet: 1,
  });
  const delayChannel = new Tone.Channel({ volume: -8 }).connect(master);
  delay.connect(delayChannel);
  const delayReceive = new Tone.Channel({ volume: 0 }).connect(delay);
  delayReceive.receive("delay");

  // Wait for reverb IR to generate
  await reverb.ready;

  const channels = new Map();

  function createChannel(name, { volume = 0, pan = 0 } = {}) {
    const ch = new Tone.Channel({ volume, pan }).connect(master);
    channels.set(name, ch);
    return ch;
  }

  function dispose() {
    channels.forEach((ch) => ch.dispose());
    channels.clear();
    reverbReceive.dispose();
    delayReceive.dispose();
    reverb.dispose();
    delay.dispose();
    reverbChannel.dispose();
    delayChannel.dispose();
    compressor.dispose();
    master.dispose();
  }

  return {
    master,
    channels,
    fx: { reverb, delay, reverbChannel, delayChannel },
    createChannel,
    dispose,
  };
}
