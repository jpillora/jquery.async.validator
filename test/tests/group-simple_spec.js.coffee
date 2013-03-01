#=require ./index

#BASIC TESTS
describe "Group validations (Simple)", ->

  form = null
  html = """
    <div data-demo>
      <form>
        <input name="f1" value="abc" data-validate="testGroup#1">
        <input name="f2" value="def" data-validate="testGroup#2">
        <input name="f3" value="xyz">
        <input class="submit" type="submit"/>
      </form>
    </div>
  """

  #validators used in this spec
  $.asyncValidator.addGroupRules
    testGroup: (r) ->

      console.log(r.val("1"))
      console.log(r.groupElem("2").val())

      return "1 should be abc" unless r.val("1") is "abc"
      return "2 should be def" unless r.val("2") is "def"
      return true

  beforeEach ->
    $('#konacha').html html
    form = $("form")
    form.asyncValidator(skipHiddenFields: false)

  describe "Group count", ->
    it "should have 1 group", ->
      obj = form.data("asyncValidator")
      expect(_.size(obj.groups)).to.equal 1
      expect(obj.groups.date_range).to.be.defined

  describe "When submitted (simple)", ->
    it.only "should be valid", (done) ->
      form.validate (result) ->
        expect(result).to.equal `undefined`
        done()

    it "should be invalid", (done) ->
      #make invalid
      form.find("input:first").val "blah!"
      form.validate (result) ->
        expect(result).to.be.a "string"
        done()

  null
