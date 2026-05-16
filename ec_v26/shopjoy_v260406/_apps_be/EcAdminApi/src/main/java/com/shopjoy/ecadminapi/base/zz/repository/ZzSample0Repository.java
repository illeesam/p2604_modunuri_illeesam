package com.shopjoy.ecadminapi.base.sy.repository;

import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample0;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import com.shopjoy.ecadminapi.base.sy.repository.qrydsl.QZzSample0Repository;

@Repository
public interface ZzSample0Repository extends JpaRepository<ZzSample0, String>, QZzSample0Repository {
}
