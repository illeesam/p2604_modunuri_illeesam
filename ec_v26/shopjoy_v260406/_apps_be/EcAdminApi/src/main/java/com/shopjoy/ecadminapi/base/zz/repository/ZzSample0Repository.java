package com.shopjoy.ecadminapi.base.zz.repository;

import com.shopjoy.ecadminapi.base.zz.data.entity.ZzSample0;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.shopjoy.ecadminapi.base.zz.repository.qrydsl.QZzSample0Repository;

@Repository
public interface ZzSample0Repository extends JpaRepository<ZzSample0, String>, QZzSample0Repository {
}
