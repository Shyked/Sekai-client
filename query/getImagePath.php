<?php



if (isset($_GET["world"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["world"])) {
	$world = $_GET["world"];
	if (isset($_GET["image"]) && preg_match("/^([^\/\?\:\\\"\<\>\*\|]+)$/", $_GET["image"])) {
		$image = $_GET["image"];
		$folder = "../img/worlds/" . $world . "/textures/";
		$filename = $image . ".png";
		if (file_exists($folder . $filename)) {
			echo json_encode($world);
		}
		else {
			$world = "global";
			$folder = "../img/worlds/" . $world . "/textures/";
			if (file_exists($folder . $filename)) {
				echo json_encode($world);
			}
			else echo json_encode("");
		}
	}
	else echo json_encode("");
}
else echo json_encode("");