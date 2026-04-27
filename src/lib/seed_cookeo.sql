-- ============================================================
-- SUMMER BODY GOAL - Recettes Cookeo minceur
-- À exécuter APRÈS seed.sql dans Supabase SQL Editor
-- ============================================================

-- Supprime uniquement les recettes Cookeo pour pouvoir relancer
DELETE FROM recipes WHERE 'cookeo' = ANY(tags);

INSERT INTO recipes (name, description, prep_time_minutes, cook_time_minutes, servings, calories_per_serving, protein_g, carbs_g, fat_g, ingredients, steps, tags) VALUES

('Saumon vapeur brocolis et carottes Cookeo',
'Un plat ultra sain cuit à la vapeur en 10 minutes au Cookeo.',
8, 10, 2, 420, 38, 18, 20,
'[{"name":"Filet de saumon","quantity":300,"unit":"g"},{"name":"Brocoli","quantity":300,"unit":"g"},{"name":"Carottes","quantity":2,"unit":"pièces"},{"name":"Jus de citron","quantity":2,"unit":"cs"},{"name":"Aneth séché","quantity":1,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Couper le brocoli en fleurettes. Éplucher les carottes et les couper en bâtonnets.","duration_minutes":5},{"order":2,"description":"Verser 200ml d''eau dans la cuve du Cookeo.","duration_minutes":1},{"order":3,"description":"Déposer les carottes dans le panier vapeur. Poser le brocoli par-dessus.","duration_minutes":1},{"order":4,"description":"Assaisonner le saumon avec le sel, l''aneth et le jus de citron. Le poser sur les légumes.","duration_minutes":1},{"order":5,"description":"Fermer le couvercle. Sélectionner MODE VAPEUR et régler sur 10 minutes. Lancer.","duration_minutes":10},{"order":6,"description":"Une fois terminé, dresser dans l''assiette et ajouter un filet de jus de citron."}]',
ARRAY['diner','cookeo','vapeur','omega3','healthy','sans gluten']),

('Poulet champignons sauce légère Cookeo',
'Un poulet fondant en sauce crémeuse légère, prêt en 20 minutes.',
10, 17, 2, 380, 44, 8, 14,
'[{"name":"Blanc de poulet","quantity":320,"unit":"g"},{"name":"Champignons de Paris","quantity":250,"unit":"g"},{"name":"Oignon","quantity":1,"unit":"pièce"},{"name":"Bouillon de volaille","quantity":150,"unit":"ml"},{"name":"Crème légère 5%","quantity":80,"unit":"ml"},{"name":"Huile d''olive","quantity":1,"unit":"cc"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"},{"name":"Persil frais","quantity":1,"unit":"bouquet"}]',
'[{"order":1,"description":"Couper le poulet en gros cubes. Émincer l''oignon et les champignons en lamelles.","duration_minutes":5},{"order":2,"description":"Sélectionner MODE RISSOLER. Ajouter l''huile, faire dorer le poulet 3 minutes en remuant.","duration_minutes":3},{"order":3,"description":"Ajouter l''oignon et les champignons. Rissoler encore 3 minutes.","duration_minutes":3},{"order":4,"description":"Verser le bouillon et les herbes de Provence. Bien mélanger. Fermer le couvercle.","duration_minutes":1},{"order":5,"description":"Sélectionner CUISSON SOUS PRESSION et régler sur 10 minutes. Lancer.","duration_minutes":10},{"order":6,"description":"Ouvrir, ajouter la crème légère et mélanger. Parsemer de persil haché. Servir.","duration_minutes":2}]',
ARRAY['diner','cookeo','pression','proteine','healthy']),

('Cabillaud vapeur haricots verts Cookeo',
'Un poisson délicat et léger cuit à la vapeur, parfait pour le régime.',
8, 12, 2, 290, 36, 14, 6,
'[{"name":"Filet de cabillaud","quantity":350,"unit":"g"},{"name":"Haricots verts","quantity":300,"unit":"g"},{"name":"Citron","quantity":1,"unit":"pièce"},{"name":"Persil frais","quantity":1,"unit":"bouquet"},{"name":"Huile d''olive","quantity":1,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Équêter les haricots verts. Couper le citron en deux.","duration_minutes":5},{"order":2,"description":"Verser 200ml d''eau dans la cuve du Cookeo.","duration_minutes":1},{"order":3,"description":"Disposer les haricots verts dans le panier vapeur.","duration_minutes":1},{"order":4,"description":"Poser les filets de cabillaud dessus. Saler et arroser du jus d''un demi-citron.","duration_minutes":1},{"order":5,"description":"Fermer le couvercle. Sélectionner MODE VAPEUR et régler sur 12 minutes. Lancer.","duration_minutes":12},{"order":6,"description":"Dresser les haricots et le cabillaud. Arroser d''un filet d''huile d''olive et du reste de jus de citron. Persil haché."}]',
ARRAY['diner','cookeo','vapeur','light','sans gluten']),

('Boulettes de dinde courgettes Cookeo',
'Des boulettes maison fondantes en sauce, cuites en 15 minutes.',
15, 13, 2, 360, 42, 14, 12,
'[{"name":"Dinde hachée","quantity":350,"unit":"g"},{"name":"Courgette","quantity":2,"unit":"pièces"},{"name":"Tomates concassées","quantity":200,"unit":"g"},{"name":"Oignon","quantity":1,"unit":"pièce"},{"name":"Ail","quantity":1,"unit":"gousse"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"},{"name":"Huile d''olive","quantity":1,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Assaisonner la dinde hachée avec sel, herbes et ail pressé. Former des boulettes de la taille d''une balle de golf.","duration_minutes":8},{"order":2,"description":"Couper les courgettes en rondelles épaisses. Émincer l''oignon.","duration_minutes":3},{"order":3,"description":"Sélectionner MODE RISSOLER. Ajouter l''huile et faire dorer les boulettes 3 minutes en les retournant.","duration_minutes":3},{"order":4,"description":"Ajouter l''oignon, les courgettes et les tomates concassées. Mélanger délicatement.","duration_minutes":1},{"order":5,"description":"Fermer le couvercle. Sélectionner CUISSON SOUS PRESSION, régler sur 8 minutes. Lancer.","duration_minutes":8},{"order":6,"description":"Ouvrir délicatement. Servir les boulettes nappées de sauce.","duration_minutes":2}]',
ARRAY['diner','cookeo','pression','proteine','healthy']),

('Velouté poireaux carottes Cookeo',
'Un velouté chaud et réconfortant, très peu calorique.',
10, 12, 4, 120, 4, 20, 3,
'[{"name":"Poireaux","quantity":3,"unit":"pièces"},{"name":"Carottes","quantity":3,"unit":"pièces"},{"name":"Oignon","quantity":1,"unit":"pièce"},{"name":"Bouillon de légumes","quantity":700,"unit":"ml"},{"name":"Crème légère 5%","quantity":50,"unit":"ml"},{"name":"Huile d''olive","quantity":1,"unit":"cc"}]',
'[{"order":1,"description":"Émincer les poireaux (partie blanche et vert tendre). Éplucher et couper les carottes en rondelles. Émincer l''oignon.","duration_minutes":7},{"order":2,"description":"Sélectionner MODE RISSOLER. Faire revenir l''oignon dans l''huile 2 minutes.","duration_minutes":2},{"order":3,"description":"Ajouter les poireaux et les carottes. Verser le bouillon. Fermer le couvercle.","duration_minutes":1},{"order":4,"description":"Sélectionner CUISSON SOUS PRESSION et régler sur 10 minutes. Lancer.","duration_minutes":10},{"order":5,"description":"Mixer avec un mixeur plongeant directement dans la cuve jusqu''à texture veloutée.","duration_minutes":2},{"order":6,"description":"Ajouter la crème légère, mélanger et servir bien chaud."}]',
ARRAY['dejeuner','cookeo','pression','light','vegetarien','batch-cooking']),

('Lentilles vertes carottes oignons Cookeo',
'Un plat végétarien complet et rassasiant cuit en 15 minutes.',
10, 17, 4, 260, 16, 40, 4,
'[{"name":"Lentilles vertes","quantity":250,"unit":"g"},{"name":"Carottes","quantity":3,"unit":"pièces"},{"name":"Oignon","quantity":2,"unit":"pièces"},{"name":"Bouillon de légumes","quantity":600,"unit":"ml"},{"name":"Ail","quantity":2,"unit":"gousses"},{"name":"Huile d''olive","quantity":1,"unit":"cc"},{"name":"Cumin en poudre","quantity":0.5,"unit":"cc"},{"name":"Persil frais","quantity":1,"unit":"bouquet"}]',
'[{"order":1,"description":"Rincer abondamment les lentilles. Éplucher et couper les carottes en rondelles. Émincer les oignons et l''ail.","duration_minutes":7},{"order":2,"description":"Sélectionner MODE RISSOLER. Faire revenir les oignons et l''ail dans l''huile pendant 3 minutes.","duration_minutes":3},{"order":3,"description":"Ajouter les lentilles, les carottes, le cumin et le bouillon. Mélanger. Fermer le couvercle.","duration_minutes":1},{"order":4,"description":"Sélectionner CUISSON SOUS PRESSION et régler sur 12 minutes. Lancer.","duration_minutes":12},{"order":5,"description":"Ouvrir, vérifier la cuisson et la consistance. Rectifier l''assaisonnement.","duration_minutes":1},{"order":6,"description":"Servir dans des bols avec du persil haché par-dessus."}]',
ARRAY['dejeuner','cookeo','pression','vegetarien','proteine','batch-cooking']),

('Escalope de dinde tomates courgettes Cookeo',
'Un plat méditerranéen léger et parfumé en moins de 20 minutes.',
10, 13, 2, 340, 40, 16, 10,
'[{"name":"Escalope de dinde","quantity":320,"unit":"g"},{"name":"Tomates","quantity":3,"unit":"pièces"},{"name":"Courgette","quantity":2,"unit":"pièces"},{"name":"Oignon","quantity":1,"unit":"pièce"},{"name":"Ail","quantity":1,"unit":"gousse"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"},{"name":"Huile d''olive","quantity":1,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Couper la dinde en lanières. Couper les tomates en quartiers et les courgettes en rondelles. Émincer l''oignon et l''ail.","duration_minutes":7},{"order":2,"description":"Sélectionner MODE RISSOLER. Faire dorer la dinde avec l''huile pendant 3 minutes.","duration_minutes":3},{"order":3,"description":"Ajouter l''oignon, l''ail, les tomates, les courgettes et les herbes. Mélanger. Ajouter 80ml d''eau.","duration_minutes":1},{"order":4,"description":"Fermer le couvercle. Sélectionner CUISSON SOUS PRESSION, régler sur 8 minutes. Lancer.","duration_minutes":8},{"order":5,"description":"Laisser dépressuriser 2 minutes avant d''ouvrir. Servir directement.","duration_minutes":2}]',
ARRAY['diner','cookeo','pression','proteine','healthy','sans gluten']),

('Blanc de poulet riz complet Cookeo',
'Le classique poulet-riz cuit en une seule fois dans le Cookeo.',
8, 18, 2, 490, 44, 54, 8,
'[{"name":"Blanc de poulet","quantity":300,"unit":"g"},{"name":"Riz complet","quantity":160,"unit":"g"},{"name":"Bouillon de volaille","quantity":400,"unit":"ml"},{"name":"Oignon","quantity":0.5,"unit":"pièce"},{"name":"Herbes de Provence","quantity":1,"unit":"cc"},{"name":"Huile d''olive","quantity":1,"unit":"cc"},{"name":"Sel","quantity":1,"unit":"pincée"}]',
'[{"order":1,"description":"Couper le poulet en gros morceaux. Émincer le demi-oignon.","duration_minutes":4},{"order":2,"description":"Sélectionner MODE RISSOLER. Faire dorer le poulet avec l''huile pendant 3 minutes. Ajouter l''oignon et rissoler encore 1 minute.","duration_minutes":4},{"order":3,"description":"Rincer le riz complet et l''ajouter dans la cuve. Verser le bouillon chaud. Ajouter les herbes de Provence. Mélanger.","duration_minutes":2},{"order":4,"description":"Fermer le couvercle. Sélectionner CUISSON SOUS PRESSION, régler sur 18 minutes. Lancer.","duration_minutes":18},{"order":5,"description":"Laisser dépressuriser naturellement 5 minutes avant d''ouvrir. Mélanger délicatement et servir.","duration_minutes":5}]',
ARRAY['diner','cookeo','pression','proteine','equilibre']);


-- ============================================================
-- Mise à jour des dîners du planning avec recettes Cookeo
-- Alterne régulier / Cookeo pour varier
-- ============================================================

-- Semaine du 21 Avril - update les dîners Mer/Jeu/Sam en Cookeo
UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Boulettes de dinde courgettes Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-21' AND day = 'Mercredi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Saumon vapeur brocolis et carottes Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-21' AND day = 'Jeudi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Blanc de poulet riz complet Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-21' AND day = 'Samedi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Poulet champignons sauce légère Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-21' AND day = 'Dimanche' AND meal_type = 'diner';

-- Semaine du 28 Avril - update les dîners en Cookeo (alternance)
UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Cabillaud vapeur haricots verts Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Lundi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Escalope de dinde tomates courgettes Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Mercredi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Boulettes de dinde courgettes Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Vendredi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Blanc de poulet riz complet Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Samedi' AND meal_type = 'diner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Saumon vapeur brocolis et carottes Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Dimanche' AND meal_type = 'diner';

-- Ajout du velouté poireaux en déjeuner (remplacement soupe lentilles certains jours)
UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Velouté poireaux carottes Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Mardi' AND meal_type = 'dejeuner';

UPDATE meal_plans SET recipe_id = (SELECT id FROM recipes WHERE name = 'Lentilles vertes carottes oignons Cookeo' LIMIT 1)
WHERE week_start_date = '2026-04-28' AND day = 'Jeudi' AND meal_type = 'dejeuner';
