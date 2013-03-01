#=require ./index

#BASIC TESTS
describe "Group validation (Advanced)", ->

  form = null
  html = """
    <div data-demo>
      <form>
        <div>
          <input name="f1" value="" data-validate="required,number,sumTo10">
          <input name="f2" value="3" data-validate="required,number,sumTo10">
        </div>
        <input name="f3" value="abc">
        <input class="submit" type="submit"/>
      </form>
    </div>
  """
  #validators used in this spec
  $.asyncValidator.addGroupRules
    sumTo10: (r) ->
      sum = 0
      r.groupElems().each ->
        sum += parseInt($(@).val())

      return "Fields must all sum to 10 not " + sum if sum isnt 10
      true

  beforeEach ->
    $('#konacha').html html
    form = $("form")
    form.asyncValidator(skipHiddenFields: false)

  describe "When submitted (advanced)", ->

    it "group 'before' validator 'required' should fail", ->
      form.validate (result) ->
        expect(result).to.contain 'required'

    it "field validator 'number' should fail (group 'after' validator 'sumTo10' should not run yet)", ->
      form.find("input:first").val "X"
      form.validate (result) ->
        expect(result).to.have.string "digit"

    it "group 'after' validator 'sumTo10' should be reached and fail", ->
      #make valid
      form.find("input:first").val "3"
      form.validate (result) ->
        expect(result).to.have.string "must all sum to 10"

    it "group 'after' validator 'sumTo10' should pass", ->
      #make valid
      form.find("input:first").val "7"
      form.validate (result) ->
        expect(result).to.equal `undefined`

  null
