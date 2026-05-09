package com.shopjoy.ecadminapi.base.ec.pm.mapper;

import com.shopjoy.ecadminapi.base.ec.pm.data.dto.PmVoucherDto;
import com.shopjoy.ecadminapi.base.ec.pm.data.entity.PmVoucher;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
@Mapper
public interface PmVoucherMapper {

    PmVoucherDto.Item selectById(@Param("id") String id);

    List<PmVoucherDto.Item> selectList(PmVoucherDto.Request req);

    List<PmVoucherDto.Item> selectPageList(PmVoucherDto.Request req);

    long selectPageCount(PmVoucherDto.Request req);

    int updateSelective(PmVoucher entity);
}
