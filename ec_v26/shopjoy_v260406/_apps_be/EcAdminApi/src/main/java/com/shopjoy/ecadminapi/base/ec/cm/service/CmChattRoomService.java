package com.shopjoy.ecadminapi.base.ec.cm.service;

import com.shopjoy.ecadminapi.base.ec.cm.data.dto.CmChattRoomDto;
import com.shopjoy.ecadminapi.base.ec.cm.data.entity.CmChattRoom;
import com.shopjoy.ecadminapi.base.ec.cm.repository.CmChattRoomRepository;
import com.shopjoy.ecadminapi.common.exception.CmBizException;
import com.shopjoy.ecadminapi.common.util.CmUtil;
import com.shopjoy.ecadminapi.common.util.PageHelper;
import com.shopjoy.ecadminapi.common.util.SecurityUtil;
import com.shopjoy.ecadminapi.common.util.VoUtil;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CmChattRoomService {

    private final CmChattRoomRepository cmChattRoomRepository;

    @PersistenceContext
    private EntityManager em;

    /* 채팅방 키조회 */
    public CmChattRoomDto.Item getById(String id) {
        CmChattRoomDto.Item dto = cmChattRoomRepository.selectById(id).orElse(null);
        if (dto == null) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return dto;
    }

    /** getByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmChattRoomDto.Item getByIdOrNull(String id) {
        return cmChattRoomRepository.selectById(id).orElse(null);
    }

    /* 채팅방 상세조회 */
    public CmChattRoom findById(String id) {
        return cmChattRoomRepository.findById(id)
            .orElseThrow(() -> new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this)));
    }

    /** findByIdOrNull — 단건조회 (없으면 null 반환, 예외 던지지 않음) */
    public CmChattRoom findByIdOrNull(String id) {
        return cmChattRoomRepository.findById(id).orElse(null);
    }

    /* 채팅방 키검증 */
    public boolean existsById(String id) {
        return cmChattRoomRepository.existsById(id);
    }

    /** existsByIdOrThrow — 존재 확인, 없으면 CmBizException */
    public boolean existsByIdOrThrow(String id) {
        if (!cmChattRoomRepository.existsById(id)) throw new CmBizException("존재하지 않는 데이터입니다: " + id + "::" + CmUtil.svcCallerInfo(this));
        return true;
    }

    /* 채팅방 목록조회 */
    public List<CmChattRoomDto.Item> getList(CmChattRoomDto.Request req) {
        return cmChattRoomRepository.selectList(req);
    }

    /* 채팅방 페이지조회 */
    public CmChattRoomDto.PageResponse getPageData(CmChattRoomDto.Request req) {
        PageHelper.addPaging(req);
        return cmChattRoomRepository.selectPageList(req);
    }

    /* 채팅방 등록 */
    @Transactional
    public CmChattRoom create(CmChattRoom body) {
        body.setChattRoomId(CmUtil.generateId("cm_chatt_room"));
        body.setRegBy(SecurityUtil.getAuthUser().authId());
        body.setRegDate(LocalDateTime.now());
        body.setUpdBy(SecurityUtil.getAuthUser().authId());
        body.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(body);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    

    /* 채팅방 수정 */
    @Transactional
    public CmChattRoom update(String id, CmChattRoom body) {
        CmUtil.requireId(id, "id", this);
        CmChattRoom entity = findById(id);
        VoUtil.voCopyExclude(body, entity, "chattRoomId^regBy^regDate");
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        CmChattRoom saved = cmChattRoomRepository.save(entity);
        if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.flush();
        return saved;
    }

    /* 채팅방 수정 */
    @Transactional
    public CmChattRoom updateSelective(CmChattRoom entity) {
        if (entity.getChattRoomId() == null) throw new CmBizException("chattRoomId 가 필요합니다." + "::" + CmUtil.svcCallerInfo(this));
        if (!existsById(entity.getChattRoomId()))
            throw new CmBizException("존재하지 않는 데이터입니다: " + entity.getChattRoomId() + "::" + CmUtil.svcCallerInfo(this));
        entity.setUpdBy(SecurityUtil.getAuthUser().authId());
        entity.setUpdDate(LocalDateTime.now());
        int affected = cmChattRoomRepository.updateSelective(entity);
        if (affected == 0) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
        em.clear();
        return entity;
    }

    /* 채팅방 삭제 */
    @Transactional
    public void delete(String id) {
        CmUtil.requireId(id, "id", this);
        CmChattRoom entity = findById(id);
        cmChattRoomRepository.delete(entity);
        em.flush();
        if (existsById(id)) throw new CmBizException("데이터 삭제에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
    }

    

    /** save -- rowStatus(I/U/D/M) 단건 분기 처리. saveList의 단건 버전.
     *  cmd: "base"=기본 흐름. 그 외는 같은 메서드 안에서 if/else if 로 분기. */
    @Transactional
    public CmChattRoom save(String cmd, CmChattRoom entity) {
        if ("base".equals(cmd)) {
            String rowStatus  = entity.getRowStatus();
            String authId     = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            /* M(merge) / null / blank -- userId 유무로 I/U 정규화 */
            if ("M".equals(rowStatus) || rowStatus == null || rowStatus.isBlank()) {
                rowStatus = (entity.getChattRoomId() == null || entity.getChattRoomId().isBlank()) ? "I" : "U";
            }

            if ("D".equals(rowStatus)) {
                if (entity.getChattRoomId() == null)
                    throw new CmBizException("삭제 대상 chattRoomId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                if (!cmChattRoomRepository.existsById(entity.getChattRoomId()))
                    throw new CmBizException("존재하지 않는 CmChattRoom입니다: " + entity.getChattRoomId() + "::" + CmUtil.svcCallerInfo(this));
                cmChattRoomRepository.deleteById(entity.getChattRoomId());
                return null;
            } else if ("I".equals(rowStatus)) {
                entity.setChattRoomId(CmUtil.generateId("cm_chatt_room"));
                entity.setRegBy(authId); entity.setRegDate(now);
                entity.setUpdBy(authId); entity.setUpdDate(now);
                CmChattRoom saved = cmChattRoomRepository.save(entity);
                if (saved == null) throw new CmBizException("데이터 저장에 실패했습니다." + "::" + CmUtil.svcCallerInfo(this));
                return saved;
            } else if ("U".equals(rowStatus)) {
                if (entity.getChattRoomId() == null)
                    throw new CmBizException("수정 대상 chattRoomId 가 없습니다.::" + CmUtil.svcCallerInfo(this));
                entity.setUpdBy(authId);
                int affected = cmChattRoomRepository.updateSelective(entity);
                if (affected == 0)
                    throw new CmBizException("존재하지 않는 CmChattRoom입니다: " + entity.getChattRoomId() + "::" + CmUtil.svcCallerInfo(this));
                em.clear();
                return findById(entity.getChattRoomId());
            }
            throw new CmBizException("알 수 없는 rowStatus: " + rowStatus + "::" + CmUtil.svcCallerInfo(this));
        }
        throw new CmBizException("알 수 없는 save cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }

    /** saveList -- 일괄 저장 (DELETE/UPDATE/INSERT 단계별).
     *  cmd: "base"=기본 흐름. */
    @Transactional
    public void saveList(String cmd, List<CmChattRoom> rows) {
        if ("base".equals(cmd)) {
            /* 0단계: rowStatus 정규화 */
            for (CmChattRoom row : rows) {
                String rs = row.getRowStatus();
                if ("M".equals(rs) || rs == null || rs.isBlank()) {
                    row.setRowStatus((row.getChattRoomId() == null || row.getChattRoomId().isBlank()) ? "I" : "U");
                } else if (!"I".equals(rs) && !"U".equals(rs) && !"D".equals(rs)) {
                    throw new CmBizException("알 수 없는 rowStatus: " + rs + "::" + CmUtil.svcCallerInfo(this));
                }
            }
            CmUtil.requireRowIds(rows, CmChattRoom::getChattRoomId, "U", "chattRoomId", this);
            CmUtil.requireRowIds(rows, CmChattRoom::getChattRoomId, "D", "chattRoomId", this);
            String authId = SecurityUtil.getAuthUser().authId();
            LocalDateTime now = LocalDateTime.now();

            // 1단계: DELETE 일괄
            List<String> deleteIds = rows.stream()
                .filter(r -> "D".equals(r.getRowStatus()))
                .map(CmChattRoom::getChattRoomId)
                .toList();
            if (!deleteIds.isEmpty()) {
                cmChattRoomRepository.deleteAllById(deleteIds);
            }

            // 2단계: UPDATE - updateSelective
            List<CmChattRoom> updateRows = rows.stream()
                .filter(r -> "U".equals(r.getRowStatus()))
                .toList();
            for (CmChattRoom row : updateRows) {
                row.setUpdBy(authId);
                int affected = cmChattRoomRepository.updateSelective(row);
                if (affected == 0) throw new CmBizException("존재하지 않는 데이터입니다: " + row.getChattRoomId() + "::" + CmUtil.svcCallerInfo(this));
            }

            // 3단계: INSERT
            List<CmChattRoom> insertRows = rows.stream()
                .filter(r -> "I".equals(r.getRowStatus()))
                .toList();
            for (CmChattRoom row : insertRows) {
                row.setChattRoomId(CmUtil.generateId("cm_chatt_room"));
                row.setRegBy(authId); row.setRegDate(now);
                row.setUpdBy(authId); row.setUpdDate(now);
                cmChattRoomRepository.save(row);
            }

            // 4단계: 영속성 컨텍스트 동기화
            em.flush();
            em.clear();
            return;
        }
        throw new CmBizException("알 수 없는 saveList cmd: " + cmd + "::" + CmUtil.svcCallerInfo(this));
    }
}
