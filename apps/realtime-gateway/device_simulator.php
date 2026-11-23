<?php
$host = '127.0.0.1';
$port = 8283;
$deviceId = $argv[1] ?? '10caa0a10915052b07';
$addr = $argv[2] ?? '64';
$channelCount = $argv[3] ?? 16;

echo "=== Device Simulator ===\n";
echo "Device ID: {$deviceId}\n";
echo "Addr: {$addr}\n";
echo "Channel count: {$channelCount}\n";
echo "Connecting to {$host}:{$port} ...\n";

while (true) {
    try {
        $fp = fsockopen($host, $port, $errno, $errstr, 30);

        if (!$fp) {
            echo "Connection failed: {$errstr} ({$errno})\n";
            sleep(3);
            continue;
        }

        echo "Connected successfully!\n";

        stream_set_timeout($fp, 3);
        stream_set_blocking($fp, false);

        $statuses = array_fill(0, (int)$channelCount, 0);

        $initialMsg = json_encode([
            'addr' => $addr,
            'cmd'  => 'upload',
            'x'    => $statuses,
            'id'   => $deviceId,
        ]);

        fwrite($fp, $initialMsg . "\n");
        echo "Sent initial status\n";

        $lastUpload = time();

        while (true) {
            $read = [$fp];
            $write = null;
            $except = null;

            if (feof($fp)) {
                echo "Connection closed by server\n";
                break;
            }

            $result = stream_select($read, $write, $except, 0, 500000);

            if ($result === false) {
                echo "Stream select error\n";
                break;
            }

            if ($result > 0) {
                $data = fread($fp, 8192);

                if ($data === false || $data === '') {
                    break;
                }

                $lines = explode("\n", trim($data));

                foreach ($lines as $line) {
                    $line = trim($line);
                    if (empty($line)) {
                        continue;
                    }

                    $decoded = json_decode($line, true);

                    if ($decoded && isset($decoded['cmd']) && $decoded['cmd'] === 'set') {
                        echo "Received SET command: " . $line . "\n";

                        $newStatuses = $decoded['y'] ?? [];
                        foreach ($newStatuses as $index => $value) {
                            if ($value == 1) {
                                $statuses[$index] = 1;
                            } elseif ($value == 0) {
                                $statuses[$index] = 0;
                            } elseif ($value == 2) {
                                $statuses[$index] = $statuses[$index] ? 0 : 1;
                            }
                        }

                        $confirmMsg = json_encode([
                            'addr' => $addr,
                            'cmd'  => 'upload',
                            'x'    => $statuses,
                            'id'   => $deviceId,
                        ]);
                        fwrite($fp, $confirmMsg . "\n");
                        echo "Sent status update after SET: [" . implode(',', $statuses) . "]\n";
                    }
                }
            }

            $now = time();
            if ($now - $lastUpload >= 5) {
                $heartbeat = json_encode([
                    'addr' => $addr,
                    'cmd'  => 'upload',
                    'x'    => $statuses,
                    'id'   => $deviceId,
                ]);
                fwrite($fp, $heartbeat . "\n");
                echo "Heartbeat sent, status: [" . implode(',', $statuses) . "]\n";
                $lastUpload = $now;
            }
        }

        fclose($fp);

    } catch (Exception $e) {
        echo "Error: {$e->getMessage()}\n";
    }

    echo "Reconnecting in 3 seconds...\n";
    sleep(3);
}
