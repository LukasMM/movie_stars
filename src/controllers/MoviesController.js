const knex = require("../database/knex")

class NotesController {
  async create(request, response) {
    const { title, description, rating, tags } = request.body
    const user_id = request.user.id

    if (!(rating <= 5 && rating >= 0)) {
      throw new AppError("Esta avaliação precisa ser entre 0 a 5.")
    }

    const [note_id] = await knex("movie_notes").insert({
      title,
      description,
      rating,
      user_id
    })

    const tagsInsert = tags.map(tag => {
      return {
        note_id,
        user_id,
        title: tag
      }
    })

    await knex("movie_tags").insert(tagsInsert)

    response.json()
  }
  
  async show(request, response) {
    const { id } = request.params

    const note = await knex("movie_notes").where({ id }).first()
    const tags = await knex("movie_tags").where({ note_id: id }).orderBy("title")

    return response.json({
      ...note,
      tags
    })
  }
  
  async delete(request, response) {
    const { id } = request.params

    await knex("movie_notes").where({ id }).delete()

    return response.json()
  }
  
  async index(request, response) {
    const { title } = request.query
    const user_id = request.user.id

    let movies
    
    if (title) {
      movies = await knex("movie_notes")
        .where({ user_id })
        .whereLike("title", `%${title}%`)
        .orderBy("title")
    } else {
      movies = await knex("movie_notes")
        .where({ user_id })
        .orderBy("title")
    }
    
    const userTags = await knex("movie_tags").where({ user_id })
    
    const notesWithTags = movies.map(note => {
      const noteTags = userTags.filter(tag => tag.note_id === note.id)

      return {
        ...note,
        tags: noteTags
      }
    })

    return response.json(notesWithTags)
  }
}

module.exports = NotesController