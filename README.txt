CHARLI ÉLUS WEB V1.1 — TEST PC

MODE D'EMPLOI RAPIDE
1. Décompresser complètement le ZIP.
2. Ouvrir le dossier extrait.
3. Double-cliquer sur « LANCER CHARLI ELUS.bat ».
4. Le navigateur s'ouvre sur Charli Élus.
5. Laisser la fenêtre noire ouverte pendant le test.
6. Pour arrêter le test, fermer la fenêtre noire.

IMPORTANT : le lanceur nécessite Python sur le PC. La future version hébergée sur Internet n'en aura pas besoin.

CHARLI ÉLUS WEB V1

1. Cette version est strictement consultative.
2. Pour tester localement, lancer un petit serveur HTTP dans ce dossier (un double-clic sur index.html peut empêcher le chargement JSON selon le navigateur).
3. Le fichier lu par l'application est Charli_Consultation.json.
4. Remplacer ce fichier par le fichier de consultation réel de Charli STM pour tester avec les vraies données.
5. Pour une mise en ligne permanente, publier le dossier sur un hébergement Web HTTPS. L'adresse peut ensuite rester identique pendant les évolutions.

Écrans V1 : Accueil Tableau de bord/CODIR, Planning, Chantiers, Équipes, Priorités/Vigilances.

V1.4 — adaptation au format réel Charli STM :
- chantiers lus via name/location/status/progress/watchLevel/watchNote/nextAction/endDate/phases ;
- aucun pourcentage inventé quand progress = null ;
- fichier Charli_Consultation.json réel inclus pour test.
