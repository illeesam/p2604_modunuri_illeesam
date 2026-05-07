package com.shopjoy.ecadminapi.base.sy.service;

import com.shopjoy.ecadminapi.base.sy.data.dto.ZzSample1Dto;
import com.shopjoy.ecadminapi.base.sy.data.entity.ZzSample1;
import com.shopjoy.ecadminapi.base.sy.mapper.ZzSample1Mapper;
import com.shopjoy.ecadminapi.base.sy.repository.ZzSample1Repository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.response.PageResult;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ZzSample1Service {


    private final ZzSample1Mapper zzSample1Mapper;
    private final ZzSample1Repository zzSample1Repository;

    /** getById — 조회 */
    @Transactional(readOnly = true)
    public ZzSample1Dto getById(String id) {
        // zz_sample1 :: select one :: id [orm:mybatis]
        return zzSample1Mapper.selectById(id);
    }

    /** getList — 조회 */
    @Transactional(readOnly = true)
    public List<ZzSample1Dto> getList(Map<String, Object> p) {
        if (p.containsKey("pageSize")) PageHelper.addPaging(p);
        // zz_sample1 :: select list :: p [orm:mybatis]
        return zzSample1Mapper.selectList(p);
    }

    /** getPageData — 조회 */
    @Transactional(readOnly = true)
    public PageResult<ZzSample1Dto> getPageData(Map<String, Object> p) {
        PageHelper.addPaging(p);
        // zz_sample1 :: select page :: p [orm:mybatis]
        return PageResult.of(zzSample1Mapper.selectPageList(p), zzSample1Mapper.selectPageCount(p),
            PageHelper.getPageNo(), PageHelper.getPageSize(), p);
    }

    /** update — 수정 */
    @Transactional
    public int update(ZzSample1 entity) {
        // zz_sample1 :: update :: entity [orm:mybatis]
        return zzSample1Mapper.updateSelective(entity);
    }

    /** create — 생성 */
    @Transactional
    public ZzSample1 create(ZzSample1 entity) {
        entity.setSample1Id(CmUtil.generateId("zz_sample1"));
        entity.setRgtr(SecurityUtil.getAuthUser().authId());
        entity.setRegDt(LocalDate.now());
        // zz_sample1 :: insert or update :: [orm:jpa]
        return zzSample1Repository.save(entity);
    }

    /** save — 저장 */
    @Transactional
    public ZzSample1 save(ZzSample1 entity) {
        if (!zzSample1Repository.existsById(entity.getSample1Id()))
            throw new CmBizException("존재하지 않는 ZzSample1입니다: " + entity.getSample1Id());
        entity.setMdfr(SecurityUtil.getAuthUser().authId());
        entity.setMdfcnDt(LocalDate.now());
        // zz_sample1 :: insert or update :: [orm:jpa]
        return zzSample1Repository.save(entity);
    }

    /** delete — 삭제 */
    @Transactional
    public void delete(String id) {
        if (!zzSample1Repository.existsById(id))
            throw new CmBizException("존재하지 않는 ZzSample1입니다: " + id);
        // zz_sample1 :: delete :: id [orm:jpa]
        zzSample1Repository.deleteById(id);
    }

}
