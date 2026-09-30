const express = require('express');
const exphbs = require('express-handlebars');
const sequelize = require('./config/bd');
const methodOverride = require('method-override');

const Filme = require('./models/filme.model');
const Diretor = require('./models/Diretor');
const Artista = require('./models/Artista');
const FichaTecnica = require('./models/FichaTecnica');

const app = express();

// CSS
app.use(express.static('css'));

// Bootstrap
app.use('/bootstrap', express.static('node_modules/bootstrap/dist'));


// ==================================================
// CONFIGURAÇÕES
// ==================================================

app.use(methodOverride('_method'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.engine(
  'handlebars',
  exphbs.engine({
    defaultLayout: false
  })
);

app.set('view engine', 'handlebars');

// ==================================================
// RELACIONAMENTOS
// ==================================================

// 1:1 - FILME E FICHA TÉCNICA
Filme.hasOne(FichaTecnica, {
  foreignKey: 'filmeId',
  as: 'fichaTecnica'
});

FichaTecnica.belongsTo(Filme, {
  foreignKey: 'filmeId',
  as: 'filme'
});

// 1:N - DIRETOR E FILME
Diretor.hasMany(Filme, {
  foreignKey: 'diretorId',
  as: 'filmes'
});

Filme.belongsTo(Diretor, {
  foreignKey: 'diretorId',
  as: 'diretor'
});

// N:N - FILME E ARTISTA
Artista.belongsToMany(Filme, {
  through: 'FilmeArtista',
  foreignKey: 'artistaId',
  as: 'filmes'
});

Filme.belongsToMany(Artista, {
  through: 'FilmeArtista',
  foreignKey: 'filmeId',
  as: 'artistas'
});

// ==================================================
// PÁGINA INICIAL
// ==================================================

app.get('/', (req, res) => {
  res.render('home', {
    titulo: 'Página Inicial'
  });
});

// ==================================================
// FILMES
// ==================================================

// LISTAR FILMES
app.get('/filmes', async (req, res) => {

  const filmes = await Filme.findAll({
    include: [
      {
        model: Diretor,
        as: 'diretor'
      },
      {
        model: Artista,
        as: 'artistas'
      }
    ]
  });

  res.render('filmes/filmes', {
    filmes: filmes.map(filme => filme.toJSON())
  });

});

// ABRIR CADASTRO DE FILME
app.get('/filmes/cadastrar', async (req, res) => {

  const diretores = await Diretor.findAll({
    raw: true
  });

  const artistas = await Artista.findAll({
    raw: true
  });

  res.render('filmes/cadastrarFilme', {
    diretores,
    artistas
  });

});

// CADASTRAR FILME
app.post('/filmes', async (req, res) => {

  const filme = await Filme.create({
    nome: req.body.nome,
    ano: req.body.ano,
    diretorId: req.body.diretorId
  });

  // Verifica se algum artista foi selecionado
  if (req.body.artistas) {

    const artistas = Array.isArray(req.body.artistas)
      ? req.body.artistas
      : [req.body.artistas];

    await filme.setArtistas(artistas);
  }

  res.redirect('/filmes');

});

// DETALHAR FILME
app.get('/filmes/:id', async (req, res) => {

  const filme = await Filme.findByPk(req.params.id, {
    include: [
      {
        model: Diretor,
        as: 'diretor'
      },
      {
        model: Artista,
        as: 'artistas'
      }
    ]
  });

  if (!filme) {
    return res.send('Filme não encontrado.');
  }

  res.render('filmes/detalharFilme', {
    filme: filme.toJSON()
  });

});

// EDITAR FILME
app.get('/filmes/:id/editar', async (req, res) => {

  const filme = await Filme.findByPk(req.params.id, {
    raw: true
  });

  if (!filme) {
    return res.send('Filme não encontrado.');
  }

  res.render('filmes/editarFilme', {
    filme
  });

});

// ATUALIZAR FILME
app.put('/filmes/:id', async (req, res) => {

  const filme = await Filme.findByPk(req.params.id);

  if (!filme) {
    return res.send('Filme não encontrado.');
  }

  filme.nome = req.body.nome;
  filme.ano = req.body.ano;

  await filme.save();

  res.redirect('/filmes');

});

// EXCLUIR FILME
app.delete('/filmes/:id', async (req, res) => {

  const filme = await Filme.findByPk(req.params.id);

  if (!filme) {
    return res.send('Filme não encontrado.');
  }

  await filme.destroy();

  res.redirect('/filmes');

});

// ==================================================
// ARTISTAS
// ==================================================

// LISTAR ARTISTAS
app.get('/artistas', async (req, res) => {

  const artistas = await Artista.findAll({
    raw: true
  });

  res.render('artistas/artistas', {
    artistas
  });

});

// ABRIR CADASTRO
app.get('/artistas/cadastrar', (req, res) => {

  res.render('artistas/cadastrarArtista');

});

// CADASTRAR ARTISTA
app.post('/artistas', async (req, res) => {

  await Artista.create({
    nome: req.body.nome,
    anoNascimento: req.body.anoNascimento,
    emAtividade: req.body.emAtividade === 'true',
    nomeArtistico: req.body.nomeArtistico
  });

  res.redirect('/artistas');

});

// DETALHAR ARTISTA
app.get('/artistas/:id', async (req, res) => {

  const artista = await Artista.findByPk(req.params.id, {
    raw: true
  });

  if (!artista) {
    return res.send('Artista não encontrado.');
  }

  res.render('artistas/detalharArtista', {
    artista
  });

});

// EDITAR ARTISTA
app.get('/artistas/:id/editar', async (req, res) => {

  const artista = await Artista.findByPk(req.params.id, {
    raw: true
  });

  if (!artista) {
    return res.send('Artista não encontrado.');
  }

  res.render('artistas/editarArtista', {
    artista
  });

});

// ATUALIZAR ARTISTA
app.put('/artistas/:id', async (req, res) => {

  const artista = await Artista.findByPk(req.params.id);

  if (!artista) {
    return res.send('Artista não encontrado.');
  }

  artista.nome = req.body.nome;
  artista.anoNascimento = req.body.anoNascimento;
  artista.emAtividade = req.body.emAtividade === 'true';
  artista.nomeArtistico = req.body.nomeArtistico;

  await artista.save();

  res.redirect('/artistas');

});

// EXCLUIR ARTISTA
app.delete('/artistas/:id', async (req, res) => {

  const artista = await Artista.findByPk(req.params.id);

  if (!artista) {
    return res.send('Artista não encontrado.');
  }

  await artista.destroy();

  res.redirect('/artistas');

});

// ==================================================
// DIRETORES
// ==================================================

// LISTAR DIRETORES
app.get('/diretores', async (req, res) => {

  const diretores = await Diretor.findAll({
    raw: true
  });

  res.render('diretores/diretores', {
    diretores
  });

});

// ABRIR CADASTRO
app.get('/diretores/cadastrar', (req, res) => {

  res.render('diretores/cadastrarDiretor');

});

// CADASTRAR DIRETOR
app.post('/diretores', async (req, res) => {

  await Diretor.create({
    nome: req.body.nome,
    anoNascimento: req.body.anoNascimento,
    nacionalidade: req.body.nacionalidade
  });

  res.redirect('/diretores');

});

// DETALHAR DIRETOR
app.get('/diretores/:id', async (req, res) => {

  const diretor = await Diretor.findByPk(req.params.id, {
    include: [
      {
        model: Filme,
        as: 'filmes'
      }
    ]
  });

  if (!diretor) {
    return res.send('Diretor não encontrado.');
  }

  res.render('diretores/detalharDiretor', {
    diretor: diretor.toJSON()
  });

});

// EDITAR DIRETOR
app.get('/diretores/:id/editar', async (req, res) => {

  const diretor = await Diretor.findByPk(req.params.id, {
    raw: true
  });

  if (!diretor) {
    return res.send('Diretor não encontrado.');
  }

  res.render('diretores/editarDiretor', {
    diretor
  });

});

// ATUALIZAR DIRETOR
app.put('/diretores/:id', async (req, res) => {

  const diretor = await Diretor.findByPk(req.params.id);

  if (!diretor) {
    return res.send('Diretor não encontrado.');
  }

  diretor.nome = req.body.nome;
  diretor.anoNascimento = req.body.anoNascimento;
  diretor.nacionalidade = req.body.nacionalidade;

  await diretor.save();

  res.redirect('/diretores');

});

// EXCLUIR DIRETOR
app.delete('/diretores/:id', async (req, res) => {

  const diretor = await Diretor.findByPk(req.params.id);

  if (!diretor) {
    return res.send('Diretor não encontrado.');
  }

  await diretor.destroy();

  res.redirect('/diretores');

});

// ==================================================
// FICHA TÉCNICA
// ==================================================

// LISTAR FICHAS
app.get('/fichatecnica', async (req, res) => {

  const fichas = await FichaTecnica.findAll({
    include: [
      {
        model: Filme,
        as: 'filme'
      }
    ]
  });

  res.render('fichatecnica/fichatecnicas', {
    fichas: fichas.map(ficha => ficha.toJSON())
  });

});

// ABRIR CADASTRO DE FICHA
app.get('/fichatecnica/cadastrar', async (req, res) => {

  const filmes = await Filme.findAll({
    raw: true
  });

  res.render('fichatecnica/cadastrarFichaTecnica', {
    filmes
  });

});

// CADASTRAR FICHA
app.post('/fichatecnica', async (req, res) => {

  await FichaTecnica.create({
    filmeId: req.body.filmeId,
    duracaoMinutos: req.body.duracaoMinutos,
    orcamento: req.body.orcamento,
    bilheteria: req.body.bilheteria
  });

  res.redirect('/fichatecnica');

});

// CADASTRO DE FICHA PELO FILME
app.get('/filmes/:id/ficha-tecnica/cadastrar', async (req, res) => {

  const filme = await Filme.findByPk(req.params.id, {
    raw: true
  });

  if (!filme) {
    return res.send('Filme não encontrado.');
  }

  res.render('fichatecnica/cadastrarFichaTecnica', {
    filme
  });

});

// SALVAR FICHA PELO FILME
app.post('/filmes/:id/ficha-tecnica', async (req, res) => {

  const filme = await Filme.findByPk(req.params.id);

  if (!filme) {
    return res.send('Filme não encontrado.');
  }

  await filme.createFichaTecnica({
    duracaoMinutos: req.body.duracaoMinutos,
    orcamento: req.body.orcamento,
    bilheteria: req.body.bilheteria
  });

  res.redirect(`/filmes/${req.params.id}`);

});

// DETALHAR FICHA
app.get('/fichatecnica/:id', async (req, res) => {

  const ficha = await FichaTecnica.findByPk(req.params.id, {
    include: [
      {
        model: Filme,
        as: 'filme'
      }
    ]
  });

  if (!ficha) {
    return res.send('Ficha Técnica não encontrada.');
  }

  res.render('fichatecnica/detalharFichaTecnica', {
    ficha: ficha.toJSON()
  });

});

// ==================================================
// BANCO DE DADOS
// ==================================================

async function conectarBD() {

  try {

    await sequelize.sync();

    console.log(
      'Conexão com o banco de dados estabelecida com sucesso!'
    );

  } catch (erro) {

    console.error('Erro ao conectar:', erro);

  }

}

conectarBD();

// ==================================================
// SERVIDOR
// ==================================================

app.listen(3000, () => {

  console.log(
    'Servidor executando em http://localhost:3000'
  );

});