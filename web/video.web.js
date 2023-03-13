import React from 'react';
import shaka from 'shaka-player/dist/shaka-player.ui';
import 'shaka-player/dist/controls.css';

/**
 * A React component for shaka-player.
 * @param {string} src
 * @param {shaka.extern.PlayerConfiguration} coßnfig
 * @param {boolean} autoPlay
 * @param {object} headers
 * @param {number} width
 * @param {number} height
 * @param ref
 * @returns {*}
 * @constructor
 */
function WebPlayer(
  {src, config, chromeless, className, headers, ...rest},
  ref,
) {
  const uiContainerRef = React.useRef(null);
  const videoRef = React.useRef(null);

  const [player, setPlayer] = React.useState(null);
  const [ui, setUi] = React.useState(null);

  // Effect to handle component mount & mount.
  // Not related to the src prop, this hook creates a shaka.Player instance.
  // This should always be the first effect to run.
  React.useEffect(() => {
    const player = new shaka.Player(videoRef.current);
    setPlayer(player);

    let ui;
    if (!chromeless) {
      const ui = new shaka.ui.Overlay(
        player,
        uiContainerRef.current,
        videoRef.current,
      );
      setUi(ui);
    }

    return () => {
      player.destroy();
      if (ui) {
        ui.destroy();
      }
    };
  }, []);

  // Keep shaka.Player.configure in sync.
  React.useEffect(() => {
    if (player && config) {
      console.log('here in confif', config);
      player.configure({
        ...config,
        streaming: {
          bufferingGoal: 120
        }
      });
    }
  }, [player, config]);

  React.useEffect(() => {
    if (player && headers) {
      player
        .getNetworkingEngine()
        .registerRequestFilter(function (type, request) {
          console.log(
            'type',
            type,
            shaka.net.NetworkingEngine.RequestType.LICENSE,
          );
          if (type == shaka.net.NetworkingEngine.RequestType.LICENSE) {
            request.headers[Object.keys(headers)[0]] =
              Object.values(headers)[0];
          }
        });
    }
  }, [player, headers]);

  // Load the source url when we have one.
  React.useEffect(() => {
    if (player && src) {
      player.load(src);
    }
  }, [player, src]);

  // Define a handle for easily referencing Shaka's player & ui API's.
  React.useImperativeHandle(
    ref,
    () => ({
      get player() {
        return player;
      },
      get ui() {
        return ui;
      },
      get videoElement() {
        return videoRef.current;
      },
    }),
    [player, ui],
  );

  return (
    <div ref={uiContainerRef} className={className}>
      <video
        ref={videoRef}
        style={{
          maxWidth: '100%',
          width: '100%',
        }}
        {...rest}
      />
    </div>
  );
}

export default React.forwardRef(WebPlayer);