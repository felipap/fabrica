package models

type User struct {
	// Id        bson.ObjectId `bson:"_id,omitempty"`
	Email     string
	Password  []byte
	FirstName string
	Location  string
	Admin     bool `bson:"admin,omitempty"`
}

func EncryptPassword(password string) (hpass []byte, err error) {
	return
}

func (u *User) SetPassword(password string) {
	hpass, err := EncryptPassword(password)
	if err != nil {
	}
	u.Password = hpass
}

// https://github.com/rif/lov3lyme/blob/master/src/app/models/user.go
