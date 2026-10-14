const express = require('express');
const app = express();
const PORT = 3000;

app.use(express.json());


let product = [
    { id: 1, nume: "Laptop", pret: 3500 },
    { id: 2, nume: "Mouse", pret: 150 }
];

// ==========================================
// 1. READ ALL - GET
// ==========================================
app.get('/product', (req, res) => {
    res.status(200).json(product);
});

// ==========================================
// 2. READ ONE - GET
// ==========================================
app.get('/product/:id', (req, res) => {
    const idProdus = parseInt(req.params.id);
    const produs = product.find(p => p.id === idProdus);

    if (!produs) {
        return res.status(404).json({ mesaj: "Produsul nu a fost găsit!" });
    }
    res.status(200).json(produs);
});

// ==========================================
// 3. CREATE  - POST
// ==========================================
app.post('/product', (req, res) => {
    const { nume, pret } = req.body;

    if (!nume || !pret) {
        return res.status(400).json({ mesaj: "Numele și prețul sunt obligatorii!" });
    }

    const produsNou = {
        id: product.length > 0 ? product[product.length - 1].id + 1 : 1,
        nume,
        pret
    };

    product.push(produsNou);
    res.status(201).json({ mesaj: "Produs adăugat cu succes!", date: produsNou });
});

// ==========================================
// 4. UPDATE - PUT
// ==========================================
app.put('/product/:id', (req, res) => {
    const idProdus = parseInt(req.params.id);
    const { nume, pret } = req.body;
    
    const index = product.findIndex(p => p.id === idProdus);

    if (index === -1) {
        return res.status(404).json({ mesaj: "Produsul pe care vrei să îl modifici nu există!" });
    }

    // Actualizăm câmpurile doar dacă au fost trimise în request
    product[index].nume = nume || product[index].nume;
    product[index].pret = pret || product[index].pret;

    res.status(200).json({ mesaj: "Produs actualizat cu succes!", date: product[index] });
});

// ==========================================
// 5. DELETE (Șterge un produs) - DELETE
// ==========================================
app.delete('/product/:id', (req, res) => {
    const idProdus = parseInt(req.params.id);
    const index = product.findIndex(p => p.id === idProdus);

    if (index === -1) {
        return res.status(404).json({ mesaj: "Produsul nu a fost găsit pentru a fi șters!" });
    }

    // Ștergem produsul din array
    const produsSters = product.splice(index, 1);
    res.status(200).json({ mesaj: "Produs șters cu succes!", date: produsSters[0] });
});

// Pornirea serverului
app.listen(PORT, () => {
    console.log(`Serverul rulează la adresa http://localhost:${PORT}`);
});
