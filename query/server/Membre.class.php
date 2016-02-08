<?php

require_once 'myPDO.include.php';


class Membre {
	private $num = null;

	private $email = null;

	private $ville = null;
	
	private $adresse = null;
	
	private $cp = null;

	private $admin = false;
	
	private $num_pers = false;
	
	private $nom_temp = null;
	
	private $prenom_temp = null;

	private $description = null;
	
	public static $session_key = "__aiir__";


	
	
	public function getNum() {
		return $this->num;
	}
	
	public function getEmail() {
		return $this->email;
	}
	
	public function getVille() {
		return $this->ville;
	}
	
	public function getAdresse() {
		return $this->adresse;
	}
	
	public function getCp() {
		return $this->cp;
	}
	
	public function isAdmin() {
		return ($this->admin==0)?false:true;
	}
	
	public function getNumPers() {
		return $this->num_pers;
	}

	public function getDesc() {
		return $this->description;
	}

	public function getDispDesc() {
		return "<p>" . str_replace("<br />","</p><p>",nl2br(Webpage::escapeString($this->description))) . "</p>";
	}
	
	public function getOubli() {
		global $pdo;
		$stmt = $pdo->prepare(<<<SQL
			SELECT oubli
			FROM MEMBRE
			WHERE num = ?
SQL
		);
		$stmt->execute(array($this->num));
		$line = $stmt->fetch();
		return $line["oubli"];
	}
	
	
	/** 
	 * getPersonne
	 *
	 * Récupère la Personne instanciée correspondant au Membre.
	 * 
	 * @return Personne La Personne coresspondante
	 */
	public function getPersonne() {
		require_once 'Personne.class.php';
		$pers;
		try {
			$pers = Personne::createFromID($this->num_pers);
		} catch (Exception $e) {
			$pers = false;
		}
		return $pers;
	}
	
	
	/** 
	 * getAll
	 *
	 * Retourne la totalité des Membres
	 * 
	 * @return array Tableau de Membre
	 */
	public static function getAll() {
		global $pdo;
		$stmt = $pdo->prepare(<<<SQL
			SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp, description
			FROM MEMBRE m
SQL
		);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__);
		$stmt->execute();
		return $stmt->fetchAll();
	}
	
	
	/** 
	 * setNumPers
	 *
	 * Définit le numéro de personne d'un Membre
	 *
	 * @param int $numPers L'identifiant de la Personne
	 */
	public function setNumPers($numPers) {
		if (Membre::isPersNotTaken($numPers)){
			global $pdo;
			$stmt = $pdo->prepare(<<<SQL
					UPDATE MEMBRE SET num_pers = :numPers WHERE num = :num
SQL
);
			$stmt->execute(array(
			 "numPers" => $numPers,
			 "num" => $this->num
			));
			$this->num_pers = $numPers;
		}else{
			//throw new Exception('Id déjà utilisé') ;
			echo ("<script>
				alert(\"Vous ne pouvez pas associer deux membres pour une personne !\");
				document.location.href='./auth.php?action=accept'; 
			</script>");
			exit();
			/*header('location: admin.php?action=accept');
			exit();*/
		}
	}
	
	/**
	 * setEmail
	 * 
	 * Change l'email d'un Membre en effectuant les vérifications nécessaires.
	 * L'email ne doit pas être déjà utilisé
	 * L'email doit être formaté correctment
	 * 
	 * @param string $email La nouvelle adresse mail
	 * @throws Exception Dans le cas où l'adresse mail serait déjà utilisée par
	 * un autre Membre.
	 */
	public function setEmail($email) {
		$regex = "#^[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$#";
		if (preg_match($regex, $email)) {
			global $pdo;
			$testMembre = $pdo->prepare(<<<SQL
				SELECT email
				FROM MEMBRE
				WHERE email = :email
				AND num != :num
SQL
);
			$testMembre->execute(array(
			 "email" => $email,
			 "num" => $this->num
			));
			$array = $testMembre->fetchAll();
		
			if (count($array) == 0) {
				$stmt = myPDO::getInstance()->prepare(<<<SQL
					UPDATE MEMBRE
					SET EMAIL = :email
					WHERE NUM = :user
SQL
);
				$stmt->execute(array(
				 "email" => $email,
				 "user" => $this->num
				));
				$this->email = $email;
			}
			else {
				throw new Exception("Cet email est déjà utilisé par un autre Membre");
			}
		}
	}
	
	/** 
	 * setPassword
	 *
	 * Modifie le mot de passe du membre
	 *
	 * @param string $pass le mot de passe. Il doit être codé en sha1
	 */
	public function setPassword($pass) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
				UPDATE MEMBRE
				SET MOT_DE_PASSE = :pass
				WHERE NUM = :user
SQL
);
		$stmt->bindValue(':pass', $pass);
		$stmt->bindValue(':user', $this->num);
		$stmt->execute();
	}
	
	public function setVille($ville) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
			UPDATE MEMBRE
			SET VILLE = :ville
			WHERE NUM = :user
SQL
);
		$stmt->bindValue(':ville', $ville);
		$stmt->bindValue(':user', $this->num);
		$stmt->execute();
	}
	
	public function setAdresse($adr) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
			UPDATE MEMBRE
			SET ADRESSE = :adr
			WHERE NUM = :user
SQL
);
		$stmt->bindValue(':adr', $adr);
		$stmt->bindValue(':user', $this->num);
		$stmt->execute() ;
	}
	
	public function setCp($cp) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
			UPDATE MEMBRE
			SET CP = :cp
			WHERE NUM = :user
SQL
);
		$stmt->bindValue(':cp', $cp);
		$stmt->bindValue(':user', $this->num);
		$stmt->execute() ;
	}
	
	public function setDescription($desc) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
			UPDATE MEMBRE
			SET description = :desc
			WHERE NUM = :user
SQL
);
		$stmt->bindValue(':desc', $desc);
		$stmt->bindValue(':user', $this->num);
		$stmt->execute() ;
	}
	
	public function setOubli($oubli){
		$stmt = myPDO::getInstance()->prepare(<<<SQL
				UPDATE MEMBRE
				SET oubli = ?
				WHERE num = ?
SQL
			);
			$stmt->bindValue(1,$oubli);
			$stmt->bindValue(2,$this->num);
			$stmt->execute();
	}
	
	
	
	
	/**
	 * isPersNotTaken
	 * 
	 * Vérifie qu'aucun membre n'est déjà associé à cette personne
	 * 
	 * @param int $numPers Un numéro de Personne
	 * @return boolean true si elle n'est pas prise, false sinon
	 */
	public static function isPersNotTaken($numPers) {
		try {
			$test = self::createFromPers($numPers);
			$res = false;
		} catch(Exception $e) {
			$res = true;
		}
		return $res;
	}
	
	/** 
	 * createFromAuth
	 *
	 * CONNEXION - Tente de connecter un utilisateur à partir d'une chaîne cryptée
	 *
	 * @param string $crypt La chaîne cryptée. ---> sha1(sha1(email) + challenge + sha1(password))
	 * 
	 * @return Membre
	 */
	public static function createFromAuth($crypt) {
		global $pdo;
		self::startSession();
		$stmt = $pdo->prepare(<<<SQL
			SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp, description
			FROM MEMBRE m
SQL
		);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__);
		$stmt->execute();
		$array = $stmt->fetchAll();
		
		$userRow = null;
		
		foreach ($array as $key => $val) {
			if (sha1(sha1($val->email) . $_SESSION[self::$session_key."challenge"] .  $val->mot_de_passe) == $crypt) {
				$userRow = $val;
				break;
			}
		}
		
		if (!$userRow) throw new exception('1'); // Erreur n1
		else if (!$userRow->num_pers) throw new exception('2'); // Erreur n2
		
		$userRow->setOubli(0);
		
		//Déclaration de Membre dans la session
		$_SESSION[self::$session_key.'Membre'] = $userRow;
		$_SESSION[self::$session_key."connected"] = true;
		return $_SESSION[self::$session_key.'Membre'];
	}
	
	

	/** 
	 * signUp
	 *
	 * INSCRIPTION - Permet d'inscrire une nouvelle personne dans la base de données
	 *
	 * @param string $email email du nouvel inscrit
	 * @param string $pass Mot de passe crypté du nouvel inscrit
	 * @param int $statut Son statut (0 : étudiant, 1 : enseignant)
	 * @param string $ville La ville
	 * @param int $admin 1 si admin, 0 sinon
	 * 
	 */
	public static function signUp($email, $pass, $ville, $adresse, $cp, $admin, $nom, $prenom, $captcha){
		
		$b = true;
		
		$regex = "#^[A-Za-zÄÃÅÈËÇÊÉÌÍÎÏÒÓÔÖÙÚÛÜÝâàáãäçèéêëìíîïñôöùúûüýÿ -']+$#";
		if (!(preg_match($regex, $nom) && preg_match($regex, $prenom))) $b = false;
		if (!preg_match("#^[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$#", $email)) $b = false;
		if ($captcha != "saucisse" && $captcha != "SAUCISSE" && $captcha != "Saucisse") $b = false;
		
		if(!$b) throw new exception('2');
		
		$pdo = myPDO::getInstance();
		// Test si le login n'est pas déja présent dans la base de donnée
		$testMembre = $pdo->prepare(<<<SQL
				SELECT email
				FROM MEMBRE
				WHERE email = ?
SQL
	);
		$testMembre->setFetchMode(PDO::FETCH_CLASS, 'email');
		$testMembre->bindValue(1, $email , PDO::PARAM_INT);
		$testMembre->execute();
		$array = $testMembre->fetchAll();

		if(count($array) == 0)
		{
		//Création de la personne dans la base de données
		$createTable = $pdo->prepare(<<<SQL
		 INSERT INTO MEMBRE(email, mot_de_passe, ville, adresse, cp, admin, nom_temp, prenom_temp)
			VALUES (:email,:pass,:ville,:adresse,:cp,:admin,:nom,:prenom)
SQL
	);
		$createTable->execute(array(
		 "email" => $email,
		 "pass" => $pass,
		 "ville" => $ville,
		 "adresse" => $adresse,
		 "cp" => $cp,
		 "admin" => $admin,
		 "nom" => $nom,
		 "prenom" => $prenom
		));
		}
		else
		{
			throw new Exception('Id déjà utilisé') ;
		}		
	}
	
	
	
	
	
	
	
	/** 
	 * createFromID
	 *
	 * Instancie un Membre à partir de son ID
	 *
	 * @param int $num L'identifiant dans la base de données
	 * 
	 * @return Membre Le membre à qui appartient l'ID renseigné
	 */
	public static function createFromID($num) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
				SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp, description
				FROM MEMBRE
				WHERE num = ?
SQL
			);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__) ;
		$stmt->bindValue(1,$num);
		$stmt->execute() ;
		if (($object = $stmt->fetch()) !== false) {
			return $object;
		}
		self::deleteDependencies($num);
		throw new Exception('Membre not found');
 	}
	
	/** 
	 * createFromEmail
	 *
	 * Instancie un Membre à partir de son email
	 *
	 * @param int $email Le mail du membre
	 * 
	 * @return Membre Le membre à qui appartient l'email renseigné
	 */
	public static function createFromEmail($email) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
				SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp, description
				FROM MEMBRE
				WHERE email = ?
SQL
			);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__);
		$stmt->bindValue(1,$email);
		$stmt->execute();
		if (($object = $stmt->fetch()) !== false) {
			return $object ;
		}
		else return false;
 	}
	
	/** 
	 * createFromPers
	 *
	 * Instancie un Membre à partir de son numero de personne
	 *
	 * @param int $num le numero de personne dans la base de données
	 * 
	 * @return Membre Le membre à qui appartient le numero de personne renseigné
	 */
	public static function createFromPers($num) {
		$stmt = myPDO::getInstance()->prepare(<<<SQL
				SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp, description
				FROM MEMBRE
				WHERE num_pers = ?
SQL
			);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__) ;
		$stmt->bindValue(1,$num);
		$stmt->execute() ;
		if (($object = $stmt->fetch()) !== false) {
			return $object ;
		}
		throw new Exception('Membre not found') ;
 	}
	
	public static function createFromRecover($key) {
		self::startSession();
		$stmt = myPDO::getInstance()->prepare(<<<SQL
				SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp, description
				FROM MEMBRE
				WHERE oubli = ?
SQL
			);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__);
		$stmt->bindValue(1,sha1($key));
		$stmt->execute();
		$user = $stmt->fetch();
		
		if (!$user) throw new exception('1'); // Erreur n1
		else if (!$user->num_pers) throw new exception('2'); // Erreur n2
		
		$user->setOubli(1);
		
		//Déclaration de Membre dans la session
		$_SESSION[self::$session_key.'Membre'] = $user;
		$_SESSION[self::$session_key."connected"] = true;
		return $_SESSION[self::$session_key.'Membre'];
	}
	
	/** 
	 * deleteMembre
	 *
	 * Efface un Membre de la base de données
	 *
	 * @param int $num L'identifiant du membre
	 */
	public static function deleteMembre($num) {
		self::deleteDependencies($num);
		global $pdo;
		$stmt = $pdo->prepare("DELETE FROM MEMBRE WHERE num = :num");
		$stmt->execute(array("num"=>$num));
	}
	
	/**
	 * deleteDependencies
	 *
	 * Supprime les dépendances liées à un Membre
	 *
	 * @param int $num Le numéro du Membre concerné
	 */
	public static function deleteDependencies($num) {
		if (is_numeric($num)) {
			global $pdo;

			// Suppression de ses inscriptions
			$stmt = $pdo->prepare(<<<SQL
					SELECT num_inscr
					FROM INSCRIPTION
					WHERE num_membre = :num_membre
SQL
);
			$stmt->execute(array(
			 "num_membre" => $num
			));
			
			require_once "Inscription.class.php";
			while ($row = $stmt->fetch()) {
				Inscription::deleteInscription($row["num_inscr"]);
			}
			
			
			// Suppression de ses covoiturages
			$stmt = $pdo->prepare(<<<SQL
					SELECT num_voit
					FROM CO_VOITURAGE
					WHERE num_membre = :num_membre
SQL
);
			$stmt->execute(array(
			 "num_membre" => $num
			));
			
			require_once "Covoit.class.php";
			while ($row = $stmt->fetch()) {
				Covoit::deleteCovoit($row["num_voit"]);
			}
		}
	}
	
	/** 
	 * getCurrentUser
	 *
	 * Retourne l'instance de Membre de l'utilisateur connecté
	 * 
	 * @return Membre L'instance de l'utilisateur connecté
	 */
	public static function getCurrentUser() {
		if (self::isConnected()) {
			return self::createFromID($_SESSION[self::$session_key."Membre"]->getNum());
		}
		else return null;
	}
	
	
	
	
	
	/** 
	 * signForm
	 *
	 * Créé un formulaire pour l'inscription
	 *
	 * @param string $action La page de destination du formulaire
	 * @param string $submitText Le texte affiché sur le bouton Submit
	 * 
	 * @return string Le code HTML généré pour le formulaire d'inscription
	 */
	public static function signForm($action, $submitText = 'OK') {
		$form = <<<HTML
			<span class="rate" id="signup_formNotif"></span>
			<div id='log'>
				<form method='post' action='{$action}' id='formInscription' onSubmit="return verify(this)">
                    <dl>
                        <label><dt>* Nom de famille</dt><dd><input type='text' name='nom'/></dd></label>
                        <label><dt>* Prénom</dt><dd><input type='text' name='prenom'/></dd></label>
                        <label><dt>Adresse</dt><dd><input type='text' name='adresse'/></dd></label>
                        <label><dt>Ville</dt><dd><input type='text' name='ville'/></dd></label>
                        <label><dt>Code postal<dt><dd><input type='text' name='cp'/></dd></label>
                        <label><dt>* Email</dt><dd><input type='email' name='email'/></dd></label>
                        <label><dt>* Mot de Passe<dt><dd><input type='password' name='pass'/></dd></label>
						<label><dt>* Confirmez le mot de passe<dt><dd><input type='password' name='pass2'/></dd></label>
						<label><dt>* Recopier le mot suivant :</dt>
							<dd><img style='border: 1px dashed black; border-radius: 7px; margin: 10px 0 -20px 0;' id='captcha' src="./img/captcha.jpg" name="captcha"/></dd>
							<dd><input type='text' name='captcha'/></dd></label>
                        <label>* : Champs obligatoires</label>
						<dt><input type="submit" value='{$submitText}' class="button button_positive"/>
						<input type="reset" value='Annuler' class="button button_negative"/></dt>
                    </dl>
				</form>          
			</div>


			<script type="text/javascript">


				function verify(form) {
						
					var correct = {
						"lastName" : true,
						"firstname" : true,
						"email" : true,
						"password" : true,
						"passwords" : true,
						"captcha" : true
					}
					
					var regexName = /^[A-Za-zÄÃÅÈËÇÊÉÌÍÎÏÒÓÔÖÙÚÛÜÝâàáãäçèéêëìíîïñôöùúûüýÿ -']+$/;
					
					correct.lastName = regexName.test(form.nom.value);
					correct.firstName = regexName.test(form.prenom.value);
					
					correct.email = /^[a-z0-9._-]+@[a-z0-9._-]{2,}\.[a-z]{2,4}$/.test(form.email.value);
					
					correct.password = form.pass.value.length > 3;
					
					correct.passwords = (form.pass.value == form.pass2.value);
					
					correct.captcha = (form.captcha.value == "saucisse" || form.captcha.value == "SAUCISSE" || form.captcha.value == "Saucisse");
					

					var notif = "";
					if (!correct.lastName) notif += "• Nom de famille incorrect<br/>";
					if (!correct.firstName) notif += "• Prénom incorrect<br/>";
					if (!correct.email) notif += "• Email incorrect<br/>";
					if (!correct.password) notif += "• Votre mot de passe doit faire au moins 4 caractères<br/>";
					if (!correct.passwords) notif += "• Les mots de passe sont différents, veuillez vérifier votre saisie<br/>";
					if (!correct.captcha) notif += "• Le captcha est incorrect, merci de vérifier s'il a été correctement recopié<br/>"
						
					document.getElementById('signup_formNotif').innerHTML = notif;
					
					var ok = correct.lastName && correct.firstName && correct.email
							 && correct.password && correct.passwords && correct.captcha;
					
					if (ok) {
						form.pass.value = sha1(form.pass.value);
					}
					
				   return ok;

				 }

			</script>
HTML;

		return $form;
	}


	/** 
	 * loginForm
	 *
	 * Génère le formulaire de connection
	 *
	 * @param string $action La page de destination du formulaire
	 * @param string $submitText Le texte affiché sur le bouton Submit
	 * 
	 * @return string Le code HTML généré pour le formulaire de conenxion
	 */
	public static function loginForm($action, $submitText = 'OK') {

		self::startSession();
		$_SESSION[self::$session_key."challenge"] = randomCode(20);

			  
		$corps = <<<HTML
			<div id='log'>
					<form method='post' action='{$action}' id="formLogin">
                        <dl>
	                        <label><dt>Email</dt><dd><input type='email' placeholder="Email utilisateur" name='email'/></dd></label>
							<label><dt>Mot de Passe</dt><dd><input type='password' placeholder="Mot de Passe" name='pass'/></dd></label>
							<dt><input name='challenge' type='hidden' value='{$_SESSION[self::$session_key."challenge"]}'/></dt>
							<dt><input name='crypt' type='hidden' value=''/></dt>
							<dt><input type='submit' value='{$submitText}' class='button button_neutral'/></dt>
							<p><a href='motDePasseOublie.php'> Mot de passe oublié ? </a>
                        </dl>
					</form>
			</div>
			<script>
				document.getElementById('formLogin').onsubmit = function() {
					this.crypt.value = sha1(sha1(this.email.value) + this.challenge.value + sha1(this.pass.value));
					this.email.value = "";
					this.pass.value = "";
					this.challenge.value = "";
				}
			</script>
HTML;

		return $corps;
	}
	
	
	
	
	/** 
	 * startSession
	 *
	 * Permet de démarrer la session. Appelée dans chaque méthode ayant besoin des données de session.
	 */
	private static function startSession() {
		if(headers_sent()) {
			throw new /*Session*/Exception("Impossible de démarrer la session : Headers déjà envoyés");
		}
		else if (session_status() == PHP_SESSION_NONE) {
			session_start();
			
			
			try {
				$user = self::getCurrentUser();
			}
			catch (Exception $e) {
				self::logout();
			}
		}
	}
	
	/** 
	 * isConnected
	 *
	 * Permet de savoir si le Membre est connecté, ou s'il navigue sur le site en tant qu'invité
	 * 
	 * @return boolean true si il est connecté, false sinon.
	 */
	public static function isConnected() {
		self::startSession();
		if (isset($_SESSION[self::$session_key.'connected'])) {
			return $_SESSION[self::$session_key.'connected'];
		}
		return false;
	}
	


	/** 
	 * logout
	 *
	 * Déconnecte simplement l'utilisateur en détruisant toutes ses données de session
	 */
	public static function logout() {
		// On démarre la session
		self::startSession();

		// On détruit les variables de notre session
		session_unset ();

		// On détruit notre session
		session_destroy ();

		// On redirige le visiteur vers la page d'accueil
		header ('location: ./');
    
	}
	
	
	
	
	
	/** 
	* mail
	*
	* Envoit un mail au Membre
	*
	* @param string $subject Le sujet du mail
	* @param string $text Le corps du mail
	*/
	public function mail($subject,$text,$from="A.I.I.R.") {
		$text = nl2br($text);
		$from = str_replace("\n","",$from);
		$from = str_replace("\r","",$from);
		$from = mb_encode_mimeheader(utf8_decode($from));
		mail($this->email,
				"A.I.I.R. - " . mb_encode_mimeheader(utf8_decode($subject)),
				$text."<br/><br/><br/><font color='#999999'>Ce mail vous a été envoyé depuis le site A.I.I.R. Merci de ne pas répondre directement à cette adresse mail.</font>",
				<<<HEADERS
MIME-Version: 1.0
Content-type: text/html;charset=utf-8
From: {$from} <mail@{$_SERVER['HTTP_HOST']}>
HEADERS
		);
	}
	
	/** 
	* mail
	*
	* Envoit un mail au Membre de la part de du membre intéressé par la proposition
	*
	* @param string $user membre intéressé par la proposition
	* @param string $numCovoit numéro de l'annonce de covoiturage
	*/
	public function mailCovoit($user,$numCovoit) {
		$name = $user->getPersonne()->getNom().' '.$user->getPersonne()->getPrenom();
		$adrCovoit = strrev (substr(strrev ("http://".$_SERVER['HTTP_HOST'].$_SERVER['REQUEST_URI']),26)).'new_covoit.php?i='.$numCovoit;
		$mail = <<<HTML
Bonjour, {$name} est intéressé par votre proposition de covoiturage.
	
Veuillez correspondre avec lui à cette adresse : {$user->getEmail()} afin de vous arranger entre vous.
Si une entente est convenue, nous vous demandons de changer le nombre places disponible dans votre véhicule à cette adresse : {$adrCovoit}

Si vous ne voulez plus faire de covoiturage merci de le supprimer

L'équipe de A.I.I.R.
HTML;

		$this->mail('Demande de covoiturage',$mail);
	}	
	


	/**
	 * emailNewPassword
	 * 
	 * Envoit un email, et se charge par la même occasion d'activer
	 * le processus de récupération de mot de passe.
	 * 
	 * @param string $key La clé utilisée pour la récupération
	 */
	public function emailNewPassword($key){
		$name = $this->getPersonne()->getNom().' '.$this->getPersonne()->getPrenom();
		$adr = "http://".$_SERVER['HTTP_HOST'].'/auth.php'.'?action=recover&key='.$key;
		$stmt = myPDO::getInstance()->prepare(<<<SQL
			UPDATE MEMBRE
			SET oubli = ?
			WHERE num = ?
SQL
        );
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__);
		$stmt->bindValue(1,sha1($key));
		$stmt->bindValue(2,$this->num);
		$stmt->execute();
		
		$text = <<<HTML
Bonjour {$name},

Vous avez fait une demande pour réinitialiser votre mot de passe.
Pour se faire, suivez les instructions à la page suivante : {$adr}

L'equipe de A.I.I.R.

HTML;
		$this->mail('Nouveau mot de passe',$text);
	}

	
	/** 
	 * mail
	 *
	 * Envoit un mail au Membre de la part de d'un autre membre
	 *
	 * @param string $user membre voulant parler
	 */
	public function mailEmail($subject, $contenu) {
		$user = Membre::getCurrentUser();
		$name = $user->getPersonne()->getNom().' '.$user->getPersonne()->getPrenom();
		$contenu = htmlentities($contenu, ENT_QUOTES,"UTF-8");
		$text = <<<HTML
<font color="#999999">{$name} vous a envoyé le message suivant en utilisant le formulaire d'envoi de mail sur le site A.I.I.R.</font>


{$contenu}
HTML;
		$this->mail($subject,$text,$name);
}	



	
	/** 
	 * checkAdmin
	 *
	 * Vérifie si l'utilisateur courant est administrateur.
	 * Dans le cas contraire, fait une redirection vers la page de connexion
	 */
	public static function checkAdmin() {
		$user = self::getCurrentUser();
		if ($user == null || !$user->isAdmin()) {
			header("location: ./connexion.php?msg=3&lastPage=".urlencode($_SERVER["REQUEST_URI"]));
			exit;
		}
	}
	
	/** 
	 * checkConnected
	 *
	 * Vérifie si l'utilisateur courant est connecté
	 * Dans le cas contraire, fait une redirection vers la page de connexion
	 */
	public static function checkConnected() {
		if (!self::isConnected()) {
			header("location: ./connexion.php?msg=3&lastPage=".urlencode($_SERVER["REQUEST_URI"]));
			exit;
		}
	}

	/** 
	 * getNonAccepted
	 *
	 * Récupère les utilisateurs n'ayant pas encore été acceptés,
	 * c'est à dire qu'ils ne sont pas relié à une personne grâce à num_pers
	 * 
	 * @return array Tableau de Membres
	 */
	public static function getNonAccepted() {
		global $pdo;
		$stmt = $pdo->prepare(<<<SQL
				SELECT num, mot_de_passe, email, ville, adresse, cp, admin, num_pers, nom_temp, prenom_temp
				FROM MEMBRE
				WHERE NUM_PERS IS NULL
SQL
);
		$stmt->setFetchMode(PDO::FETCH_CLASS, __CLASS__);
		$stmt->execute();
		$users = $stmt->fetchAll();
		
		return $users;
	}
	
	/** 
	 * getMatchingPerson
	 *
	 * Récupère la Personne correspondant aux noms indiqués par le Membre
	 * 
	 * @return Personne La Personne correspondante. Si le nombre est différent de 1, la méthode retourne false.
	 */
	public function getMatchingPerson() {
		global $pdo;
		require_once "Personne.class.php";
		$stmt = $pdo->prepare(<<<SQL
				SELECT num_pers, prenom, nom, photo
				FROM PERSONNE
SQL
);
		$stmt->setFetchMode(PDO::FETCH_CLASS, "Personne");
		$stmt->execute();
		$personnes = $stmt->fetchAll();
		$matching = null;
		foreach ($personnes as $key => $val) {
			if (simplify($val->getNom()) == simplify($this->nom_temp)
					&& simplify($val->getPrenom()) == simplify($this->prenom_temp)) {
				if ($matching == null) $matching = $val;
				else return null;
			}
		}
		return $matching?$matching:null;
	}
	
	

	/**
	 * getAcceptanceScript
	 * 
	 * Retourne le script utilisé pour l'acceptation des nouveaux inscrits
	 * 
	 */
	public static function getAcceptanceScript() {
		return <<<JS
		
		function getRadioValue(group) {
			for (var i=0, iLen=group.length; i<iLen; i++) {
				if (group[i].checked) {
					return group[i].value;
				}
			}
			return undefined;
		  }
		
		var	currentRequest = null;
		
		function persSearch(num,input) {
			if (currentRequest != null) currentRequest.cancel();
			var select = "accept_select" + num;
			currentRequest = new Request(
					{
						url        : "ajax.php?action=persSearch",
						method     : 'post',
						handleAs   : 'text',
						parameters : { q : input.value },
						onSuccess  : function(res) {
								document.getElementById(select).innerHTML = res;
								currentRequest = null;
								acceptChange(num);
							},
						onError    : function(status, message) {
								
							}
					});
		}
		
		function acceptSubmit(form) {
			var b;
			if (getRadioValue(form.choice) == 2) {
				b = form.choice2.value != "";
				if (!b) alert("Aucune personne n'a été sélectionnée");
			}
			else if (getRadioValue(form.choice) == 3) {
				b = form.nom.value != "" && form.prenom.value != "";
				if (!b) alert("Nom et/ou prénom invalide");
			}
			else if (!getRadioValue(form.choice)) {
				b = false;
				if (!b) alert("Aucune option n'a été choisie");
			}
			return b;
		}
		
		function acceptReset(form) {
			if (confirm("Vous êtes sur le point de refuser cet utilisateur")) {
				document.location.href = "auth.php?action=deny&num="+form.membre.value;
			}
		}
		
		var currentRequestSelect = null;
		function acceptChange(num) {
			var choice = getRadioValue(document.forms["accept_form"+num].choice);
			var numPers;
			if (choice == 1) {
				numPers = document.forms["accept_form"+num].choice1.value;
			}
			else if (choice == 2) {
				numPers = document.forms["accept_form"+num].choice2.value;
			}
			else if (choice == 3) {
				var nom = document.forms["accept_form"+num].nom.value;
				var prenom = document.forms["accept_form"+num].prenom.value;
				document.getElementById("accept_avatar"+num).setAttribute("src","./img/avatars/Sans_avatar.png");
				document.getElementById("accept_name"+num).setAttribute("title",nom);
				document.getElementById("accept_firstname"+num).setAttribute("title",prenom);
				document.getElementById("accept_name"+num).innerHTML = nom.toUpperCase();
				document.getElementById("accept_firstname"+num).innerHTML = prenom;
			}
			if (numPers) {
				if (currentRequestSelect != null) currentRequestSelect.cancel();
				currentRequestSelect = new Request(
						{
							url        : "ajax.php?action=getPers",
							method     : 'post',
							handleAs   : 'json',
							parameters : { q : numPers },
							onSuccess  : function(res) {
									document.getElementById("accept_avatar"+num).setAttribute("src",res["photo"]);
									document.getElementById("accept_name"+num).setAttribute("title",res["nom"]);
									document.getElementById("accept_firstname"+num).setAttribute("title",res["prenom"]);
									document.getElementById("accept_name"+num).innerHTML = res["nom"].toUpperCase();
									document.getElementById("accept_firstname"+num).innerHTML = res["prenom"];
									currentRequestSelect = null;
								},
							onError    : function(status, message) {

								}
						});
			}
		}
JS;
	}
	
	/**
	 * getAcceptanceForm
	 * 
	 * Retourne le formulaire utilisé pour l'acceptation des nouveaux inscrits
	 * 
	 * @param Personne $pers La Personne qui correspond directement au Membre
	 * @return type
	 */
	public function getAcceptanceForm($pers = null) {
		if ($pers != null) {
			$nom = strtoupper($pers->getNom());
			$prenom = $pers->getPrenom();
			$photo = $pers->getPhoto();
			$noPers1 = "";
			$noPers2 = " checked";
			$noPers3 = "";
			$numPers = $pers->getNumPers();
		}
		else {
			$nom = "NOM";
			$prenom = "Prénom";
			$photo = "./img/avatars/Sans_avatar.png";
			$noPers1 = " accept_matchDisabled";
			$noPers2 = "";
			$noPers3 = " disabled='true'";
			$numPers = "";
		}
		$sep = (!$this->adresse || !$this->ville && !$this->cp)?"":", ";
		$nom_temp = strtoupper($this->nom_temp);
		$prenom_temp = $this->prenom_temp;
		$html = <<<HTML
				<div class="acceptContainer">
					<div class="accept_personne">
						<img class="accept_avatar" id="accept_avatar{$this->num}" src="{$photo}"/>
						<div class="accept_namesContainer">
							<span title="{$nom}" id="accept_name{$this->num}">{$nom}</span><br/>
							<span title="{$prenom}" id="accept_firstname{$this->num}">{$prenom}</span>
						</div>
						<img class="accept_groupImg" src="./img/profile.png"/>
					</div>
					<div class="accept_membre">
						{$nom_temp} {$prenom_temp}<br/>
						{$this->email}<br/>
						{$this->adresse}{$sep}{$this->ville} {$this->cp}
						<img class="accept_groupImg" src="./img/pen.png"/>
					</div>
				
					<form method="post" id="accept_form{$this->num}" action="./auth.php?action=accept" class="accept_form" onsubmit="return acceptSubmit(this);" onreset="return acceptReset(this);" enctype="multipart/form-data">
						<input type="hidden" name="membre" value="{$this->num}"/>
						<div class="accept_match accept_choice{$noPers1}">
							<label>
								<input type="radio"{$noPers2} name="choice" value="1" onchange="acceptChange({$this->num});" class="accept_radio"{$noPers3}/>
								<input type="hidden" name="choice1" value="{$numPers}"/>
								<div class="accept_radioDesc">
									La personne correspond
								</div>
							</label>
						</div>
						<div class="accept_select accept_choice">
								<input id="accept{$this->num}_radio2" type="radio" name="choice" value="2" onchange="acceptChange({$this->num});" class="accept_radio"/>
								<div class="accept_radioDesc">
									<label for="accept{$this->num}_radio2">Cette personne existe dans la base<br/></label>
									<input type="text" placeholder="Rechercher..." onkeyup="persSearch({$this->num},this);"/>
									<select id="accept_select{$this->num}" name="choice2" onchange="acceptChange({$this->num});">
									</select>
								</div>
						</div>
						<div class="accept_create accept_choice">
							<input id="accept{$this->num}_radio3" type="radio" name="choice" value="3" onchange="acceptChange({$this->num});" class="accept_radio"/>
							<div class="accept_radioDesc">
								<label for="accept{$this->num}_radio3">Cette personne n'existe pas dans la base, l'ajouter<br/></label>
								<input type="text" name="nom" placeholder="Nom" onkeyup="acceptChange({$this->num});"/>
								<input type="text" name="prenom" placeholder="Prénom" onkeyup="acceptChange({$this->num});"/><br/>
								Photo : <input type="file" name="photo"/>
							</div>
						</div>
						<div class="accept_buttons">
							<input type="reset" value="Refuser" class="button_negative button"/>
							<input type="submit" value="Valider" class="button_positive button"/>
						</div>
					</form>
				</div>
HTML;
		return $html;
	}
	

}



/** 
 * randomCode()
 *
 * Génère un code aléatoire comportant des caractères alphanumériques
 *
 * @param int $taille Nombre de caractères à générer dans le code
 * 
 * @return string Retourne le code généré
 */
function randomCode($taille /** Taille de la chaîne aléatoire */) {
	$c = '' ;
	for ($i=0; $i<$taille; $i++) {
		switch (rand(0, 2)) {
			case 0 :
				$c .= chr(rand(ord('A'), ord('Z'))) ;
				break ;
			case 1 :
				$c .= chr(rand(ord('a'), ord('z'))) ;
				break ;
			case 2 :
				$c .= chr(rand(ord('1'), ord('9'))) ;
				break ;
		}
	}
	return $c ;

}

/** 
 * simplify
 *
 * Simplifie une chaîne de caractère pour effectuer des comparaisons.
 * Remplace les majuscules par des minuscules, retire les accents,
 * supprime les caractères spéciaux.
 *
 * @param string $str La chaîne de caractère à traîter
 * 
 * @return string Le chaîne simplifiée
 */
function simplify($str) {
    $str = strtolower($str);
	
    // transformer les caractères accentués en entités HTML
    $str = htmlentities($str, ENT_NOQUOTES,"UTF-8");
	
    // remplacer les entités HTML pour avoir juste le premier caractères non accentués
    // Exemple : "&ecute;" => "e", "&Ecute;" => "E", "Ã " => "a" ...
    $str = preg_replace('#&([A-za-z])(?:acute|grave|cedil|circ|orn|ring|slash|th|tilde|uml);#', '\1', $str);
 
    // Remplacer les ligatures tel que : Œ, Æ ...
    // Exemple "Å“" => "oe"
    $str = preg_replace('#&([A-za-z]{2})(?:lig);#', '\1', $str);
    // Supprimer tout le reste
    $str = preg_replace('#&[^;]+;#', '', $str);
	
    return $str;
	
}